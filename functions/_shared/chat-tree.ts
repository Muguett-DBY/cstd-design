export interface ChatMessageNode {
  id: string;
  role: "user" | "assistant";
  content: string;
  parentId?: string | null;
  createdAt: string;
  status?: "complete" | "interrupted" | "streaming";
}

export function buildActiveBranch(messages: ChatMessageNode[], leafId: string) {
  const byId = new Map(messages.map((message) => [message.id, message]));
  const branch: ChatMessageNode[] = [];
  let cursor = byId.get(leafId);
  const seen = new Set<string>();

  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    branch.push(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return branch.reverse();
}

export function newestLeafId(messages: ChatMessageNode[]) {
  return messages.at(-1)?.id ?? null;
}
