import type { AssetItem, ChatStreamEvent, ClearScope, ConversationDetail, ConversationSummary, ImageSize, ThreadReply, VideoPreset } from "./types";

const UNAUTHORIZED_EVENT = "auth:unauthorized";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error("网络连接失败，请检查网络后重试。");
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    throw new Error("请先登录。");
  }
  if (!response.ok) {
    if (response.status === 429) throw new Error(body.error || "请求过于频繁，请稍后重试。");
    throw new Error(body.error || "请求失败。");
  }
  return body as T;
}

export function onUnauthorized(handler: () => void) {
  window.addEventListener(UNAUTHORIZED_EVENT, handler);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
}

export const api = {
  session: () => requestJson<{ authenticated: boolean; expiresAt: string | null }>("/api/session"),
  login: (password: string) => requestJson<{ authenticated: boolean; expiresAt: string }>("/api/session", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => requestJson<{ authenticated: boolean }>("/api/session", { method: "DELETE" }),
  conversations: (q = "") => requestJson<{ conversations: ConversationSummary[] }>(`/api/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createConversation: () => requestJson<{ conversation: ConversationSummary }>("/api/conversations", { method: "POST", body: JSON.stringify({ title: "新会话" }) }),
  conversation: (id: string) => requestJson<{ conversation: ConversationDetail }>(`/api/conversations/${id}`),
  renameConversation: (id: string, title: string) => requestJson<{ ok: true }>(`/api/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
  switchConversationBranch: (id: string, activeLeafId: string) => requestJson<{ ok: true }>(`/api/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ activeLeafId }) }),
  deleteConversation: (id: string) => requestJson<{ ok: true }>(`/api/conversations/${id}`, { method: "DELETE" }),
  threadReplies: (conversationId: string) =>
    requestJson<{ replies: ThreadReply[] }>(`/api/conversations/${conversationId}/threads`),
  createThreadReply: (conversationId: string, parentMessageId: string, content: string) =>
    requestJson<{ reply: ThreadReply }>(`/api/conversations/${conversationId}/threads`, {
      method: "POST",
      body: JSON.stringify({ parentMessageId, content }),
    }),
  updateThreadReply: (id: string, content: string) =>
    requestJson<{ reply: ThreadReply }>(`/api/threads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),
  deleteThreadReply: (id: string) =>
    requestJson<{ ok: true }>(`/api/threads/${id}`, { method: "DELETE" }),
  clearMessageThread: (conversationId: string, parentMessageId: string) =>
    requestJson<{ ok: true; deleted: number }>(
      `/api/conversations/${conversationId}/threads?parentMessageId=${encodeURIComponent(parentMessageId)}`,
      { method: "DELETE" },
    ),
  upload: (files: File[]) => {
    const form = new FormData();
    for (const file of files) form.append("files", file);
    return requestJson<{ assets: AssetItem[] }>("/api/uploads", { method: "POST", body: form });
  },
  assets: (kind = "") => requestJson<{ assets: AssetItem[] }>(`/api/assets${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`),
  deleteAsset: (id: string) => requestJson<{ ok: true }>(`/api/assets/${id}`, { method: "DELETE" }),
  generateImage: (input: { prompt: string; size: ImageSize; referenceAssetIds: string[] }) =>
    requestJson<{ asset: AssetItem }>("/api/images", { method: "POST", body: JSON.stringify(input) }),
  createVideo: (input: { prompt: string; preset: VideoPreset; fps: number; width: number; height: number; referenceAssetIds: string[]; keyframes: boolean; negativePrompt?: string; seed?: number }) =>
    requestJson<{ task: { id: string; status: string; progress: number } }>("/api/videos", { method: "POST", body: JSON.stringify(input) }),
  videoTask: (id: string) => requestJson<{ task: { id: string; status: string; progress: number; assetId?: string; assetUrl?: string } }>(`/api/videos/${id}`),
  abandonVideo: (id: string) => requestJson<{ ok: true }>(`/api/videos/${id}`, { method: "DELETE" }),
  clearScope: (scope: ClearScope) => requestJson<{ ok: true; deleted: { conversations: number; messages: number; assets: number; videoTasks: number; r2Objects: number } }>(`/api/clear/${scope}`, { method: "DELETE" }),
  bookmarks: (conversationId: string) => requestJson<{ bookmarks: { id: string; messageId: string; conversationId: string; createdAt: string }[] }>(`/api/conversations/${conversationId}/bookmarks`),
  addBookmark: (conversationId: string, messageId: string) => requestJson<{ bookmark: { id: string; messageId: string; conversationId: string; createdAt: string } }>(`/api/conversations/${conversationId}/bookmarks`, { method: "POST", body: JSON.stringify({ messageId }) }),
  removeBookmark: (id: string) => requestJson<{ ok: true }>(`/api/bookmarks/${id}`, { method: "DELETE" }),
  pins: (conversationId: string) => requestJson<{ pins: { id: string; messageId: string; conversationId: string; createdAt: string }[] }>(`/api/conversations/${conversationId}/pins`),
  addPin: (conversationId: string, messageId: string) => requestJson<{ pin: { id: string; messageId: string; conversationId: string; createdAt: string } }>(`/api/conversations/${conversationId}/pins`, { method: "POST", body: JSON.stringify({ messageId }) }),
  removePin: (id: string) => requestJson<{ ok: true }>(`/api/pins/${id}`, { method: "DELETE" }),
  reactions: (conversationId: string) => requestJson<{ reactions: Record<string, string[]> }>(`/api/conversations/${conversationId}/reactions`),
  toggleReaction: (conversationId: string, messageId: string, emoji: string) => requestJson<{ status: "added" | "removed" }>(`/api/conversations/${conversationId}/reactions`, { method: "POST", body: JSON.stringify({ messageId, emoji }) }),
  edits: (conversationId: string) => requestJson<{ edits: Record<string, { id: string; messageId: string; originalContent: string; editedContent: string; createdAt: string }[]> }>(`/api/conversations/${conversationId}/edits`),
  addEdit: (conversationId: string, messageId: string, originalContent: string, editedContent: string) => requestJson<{ edit: { id: string; messageId: string; originalContent: string; editedContent: string; createdAt: string } }>(`/api/conversations/${conversationId}/edits`, { method: "POST", body: JSON.stringify({ messageId, originalContent, editedContent }) }),
};

const STREAM_TIMEOUT_MS = 120_000;

export async function streamChat(
  input: { conversationId?: string; parentId?: string | null; content: string },
  handlers: { onEvent: (event: ChatStreamEvent) => void; signal?: AbortSignal },
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);
  const combinedSignal = handlers.signal
    ? combineSignals(handlers.signal, controller.signal)
    : controller.signal;
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: combinedSignal,
    });
    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "咨询失败。");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\n\n/);
      buffer = events.pop() || "";
      for (const event of events) {
        const data = event
          .split(/\r?\n/)
          .find((line) => line.startsWith("data:"))
          ?.slice(5)
          .trim();
        if (!data) continue;
        try {
          handlers.onEvent(JSON.parse(data) as ChatStreamEvent);
        } catch {
          // skip malformed event data
        }
      }
    }
  } finally {
    window.clearTimeout(timeout);
  }
}

function combineSignals(...signals: AbortSignal[]) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
