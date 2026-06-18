import { describe, expect, test } from "vitest";
import { groupThreadReplies } from "./thread-state";
import type { ChatMessage, ThreadReply } from "./types";

describe("thread state", () => {
  test("groups active-conversation replies by parent in chronological order", () => {
    const messages: ChatMessage[] = [
      { id: "m1", role: "user", content: "第一条", status: "complete" },
      { id: "m2", role: "assistant", content: "第二条", status: "complete" },
    ];
    const replies: ThreadReply[] = [
      { id: "r2", conversationId: "c1", parentMessageId: "m1", content: "后", createdAt: "2026-06-18T02:00:00.000Z", updatedAt: "2026-06-18T02:00:00.000Z" },
      { id: "r3", conversationId: "c2", parentMessageId: "m1", content: "其他会话", createdAt: "2026-06-18T03:00:00.000Z", updatedAt: "2026-06-18T03:00:00.000Z" },
      { id: "r1", conversationId: "c1", parentMessageId: "m1", content: "前", createdAt: "2026-06-18T01:00:00.000Z", updatedAt: "2026-06-18T01:00:00.000Z" },
      { id: "r4", conversationId: "c1", parentMessageId: "missing", content: "孤儿", createdAt: "2026-06-18T04:00:00.000Z", updatedAt: "2026-06-18T04:00:00.000Z" },
    ];

    expect(groupThreadReplies("c1", messages, replies)).toEqual({
      m1: [replies[2], replies[0]],
    });
  });
});
