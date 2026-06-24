import type { ConversationSummary, ChatMessage } from "../types";

interface ExportConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    parentId: string | null;
    createdAt?: string;
  }[];
}

interface BulkExport {
  version: 1;
  exportedAt: string;
  conversations: ExportConversation[];
}

export function buildConversationExport(
  summaries: ConversationSummary[],
  messageMap: Record<string, ChatMessage[]>
): BulkExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    conversations: summaries
      .filter((s) => messageMap[s.id]?.length > 0)
      .map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messages: (messageMap[s.id] || [])
          .filter((m) => m.status !== "streaming")
          .map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            parentId: m.parentId || null,
            createdAt: m.createdAt,
          })),
      })),
  };
}

export function exportConversations(
  summaries: ConversationSummary[],
  messageMap: Record<string, ChatMessage[]>
): void {
  const data = buildConversationExport(summaries, messageMap);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cstd-design-conversations-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function validateImportContent(text: string): { valid: boolean; error?: string; data?: BulkExport } {
  try {
    const data = JSON.parse(text) as BulkExport;
    if (data.version !== 1) return { valid: false, error: "不支持的版本" };
    if (!Array.isArray(data.conversations)) return { valid: false, error: "无效的对话数据" };
    return { valid: true, data };
  } catch {
    return { valid: false, error: "无法解析 JSON" };
  }
}
