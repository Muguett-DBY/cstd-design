import { buildActiveBranch } from "../_shared/chat-tree";
import { createConversation, insertMessage, readConversation, titleFromPrompt, updateMessageContent } from "../_shared/db";
import { AgnesClient } from "../_shared/agnes";
import { selectMessagesForContext } from "../_shared/context";
import { badRequest, enforceRateLimit, json, readJson, requireSession, upstreamApiKey, type PagesContext } from "../_shared/http";
import { sanitizeAssistantContent, toClientError } from "../_shared/provider";
import { ChatRequestSchema, parseRequest } from "../_shared/validation";

export async function onRequestPost({ request, env }: PagesContext) {
  const auth = await requireSession(request, env);
  if (auth.response) return auth.response;
  const limited = await enforceRateLimit(env, auth.session.sessionId, "chat", 60, 60_000);
  if (limited) return limited;
  const parsed = parseRequest(ChatRequestSchema, await readJson(request));
  if (!parsed.ok) return badRequest(parsed.error);
  const body = parsed.data;
  const content = body.content;

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
  const client = new AgnesClient({ apiKey: upstreamApiKey(env) });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let accumulated = "";
  let pendingRaw = "";

  void (async () => {
    const writeEvent = async (event: unknown) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };
    const flushSafeDelta = async (force = false) => {
      const holdback = 64;
      if (!force && pendingRaw.length <= holdback) return;
      const emitSource = force ? pendingRaw : pendingRaw.slice(0, -holdback);
      pendingRaw = force ? "" : pendingRaw.slice(-holdback);
      const delta = sanitizeAssistantContent(emitSource);
      if (!delta) return;
      accumulated += delta;
      await writeEvent({ type: "delta", assistantMessageId: assistant.id, content: delta });
    };
    try {
      await writeEvent({ type: "meta", conversationId, userMessageId: userMessage.id, assistantMessageId: assistant.id, truncated: selected.truncated });
      const upstream = await client.chat(selected.messages, { signal: request.signal });
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
            const rawDelta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || "";
            if (rawDelta) {
              pendingRaw += rawDelta;
              await flushSafeDelta();
            }
          } catch {
            // Ignore provider keepalive or partial event lines.
          }
        }
      }
      await flushSafeDelta(true);
      await updateMessageContent(env, assistant.id, accumulated, "complete");
      await writeEvent({ type: "done", assistantMessageId: assistant.id });
    } catch (error) {
      // Gracefully handle writer errors (e.g., client disconnected)
      try {
        await flushSafeDelta(true);
        const message = toClientError(error);
        await updateMessageContent(env, assistant.id, accumulated || message, accumulated ? "interrupted" : "complete");
        await writeEvent({ type: "error", assistantMessageId: assistant.id, error: message });
      } catch {
        // Writer may be closed if client disconnected
      }
    } finally {
      try { await writer.close(); } catch { /* writer already closed */ }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
