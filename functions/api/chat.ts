import { buildActiveBranch } from "../_shared/chat-tree";
import { createConversation, insertMessage, readConversation, titleFromPrompt, updateMessageContent } from "../_shared/db";
import { AgnesClient } from "../_shared/agnes";
import { selectMessagesForContext } from "../_shared/context";
import { badRequest, json, readJson, requireSession, type PagesContext } from "../_shared/http";

interface ChatRequest {
  conversationId?: string;
  parentId?: string | null;
  content?: string;
}

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const body = await readJson<ChatRequest>(request);
  const content = body?.content?.trim();
  if (!content) return badRequest("请输入问题。");

  let conversationId: string;
  let current;
  if (body?.conversationId) {
    current = await readConversation(env, body.conversationId);
    if (!current) return json({ error: "会话不存在。" }, 404);
    conversationId = current.id;
  } else {
    const created = await createConversation(env, titleFromPrompt(content));
    conversationId = created.id;
    current = await readConversation(env, conversationId);
  }
  const parentId = body?.parentId ?? current?.activeLeafId ?? null;
  const userMessage = await insertMessage(env, { conversationId, parentId, role: "user", content });
  const assistant = await insertMessage(env, { conversationId, parentId: userMessage.id, role: "assistant", content: "", status: "streaming" });
  const refreshed = await readConversation(env, conversationId);
  const branch = buildActiveBranch(refreshed?.messages || [], userMessage.id).map((message) => ({ role: message.role, content: message.content }));
  const selected = selectMessagesForContext(branch, 240_000);
  const client = new AgnesClient({ apiKey: env.AGNES_API_KEY });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let accumulated = "";

  void (async () => {
    const writeEvent = async (event: unknown) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };
    try {
      await writeEvent({ type: "meta", conversationId, userMessageId: userMessage.id, assistantMessageId: assistant.id, truncated: selected.truncated });
      const upstream = await client.chat(selected.messages);
      if (!upstream.body) throw new Error("服务没有返回流式内容。");
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string }; message?: { content?: string } }[] };
            const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || "";
            if (delta) {
              accumulated += delta;
              await writeEvent({ type: "delta", assistantMessageId: assistant.id, content: delta });
            }
          } catch {
            // Ignore provider keepalive or partial event lines.
          }
        }
      }
      await updateMessageContent(env, assistant.id, accumulated, "complete");
      await writeEvent({ type: "done", assistantMessageId: assistant.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败，请稍后重试。";
      await updateMessageContent(env, assistant.id, accumulated || message, accumulated ? "interrupted" : "complete");
      await writeEvent({ type: "error", assistantMessageId: assistant.id, error: message });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
