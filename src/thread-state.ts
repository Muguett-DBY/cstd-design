import type { ChatMessage, ThreadReply } from "./types";

export type ThreadGroups = Record<string, ThreadReply[]>;

export function groupThreadReplies(
  conversationId: string | null,
  messages: ChatMessage[],
  replies: ThreadReply[],
): ThreadGroups {
  if (!conversationId) return {};
  const messageIds = new Set(messages.map((message) => message.id));
  const groups: ThreadGroups = {};

  for (const reply of replies) {
    if (reply.conversationId !== conversationId || !messageIds.has(reply.parentMessageId)) continue;
    (groups[reply.parentMessageId] ||= []).push(reply);
  }

  for (const threadReplies of Object.values(groups)) {
    threadReplies.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return groups;
}
