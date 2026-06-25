import { describe, expect, test } from "vitest";
import { generateConversationSummary } from "./conversationSummary";
import type { ChatMessage } from "../types";

function makeMsg(role: "user" | "assistant", content: string, createdAt?: string): ChatMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role,
    content,
    status: "complete",
    createdAt: createdAt || new Date().toISOString(),
  };
}

describe("generateConversationSummary", () => {
  test("counts messages correctly", () => {
    const messages = [
      makeMsg("user", "Hello"),
      makeMsg("assistant", "Hi there"),
      makeMsg("user", "How are you?"),
    ];

    const summary = generateConversationSummary(messages, "Test Chat");
    expect(summary.messageCount).toBe(3);
    expect(summary.userMessageCount).toBe(2);
    expect(summary.assistantMessageCount).toBe(1);
    expect(summary.title).toBe("Test Chat");
  });

  test("filters out streaming messages", () => {
    const messages = [
      makeMsg("user", "Hello"),
      makeMsg("assistant", "Hi"),
      { ...makeMsg("assistant", ""), status: "streaming" as const },
    ];

    const summary = generateConversationSummary(messages, "Test");
    expect(summary.messageCount).toBe(3);
    expect(summary.assistantMessageCount).toBe(1);
  });

  test("extracts topics from content", () => {
    const messages = [
      makeMsg("user", "帮我写一段代码来处理数据"),
      makeMsg("assistant", "好的，我来帮你写代码"),
    ];

    const summary = generateConversationSummary(messages, "Test");
    expect(summary.topics).toContain("代码开发");
    expect(summary.topics).toContain("数据分析");
  });

  test("extracts key points from bullet points", () => {
    const messages = [
      makeMsg("assistant", "- 这是一个重要的建议要点\n- 另一个建议推荐的内容"),
    ];

    const summary = generateConversationSummary(messages, "Test");
    expect(summary.keyPoints.length).toBeGreaterThan(0);
  });

  test("calculates duration correctly", () => {
    const messages = [
      makeMsg("user", "Hello", "2026-06-25T10:00:00Z"),
      makeMsg("assistant", "Hi", "2026-06-25T10:30:00Z"),
    ];

    const summary = generateConversationSummary(messages, "Test");
    expect(summary.duration).toBe("30 分钟");
  });

  test("returns empty duration for single message", () => {
    const messages = [makeMsg("user", "Hello")];
    const summary = generateConversationSummary(messages, "Test");
    expect(summary.duration).toBe("");
  });

  test("handles empty messages", () => {
    const summary = generateConversationSummary([], "Empty");
    expect(summary.messageCount).toBe(0);
    expect(summary.userMessageCount).toBe(0);
    expect(summary.assistantMessageCount).toBe(0);
    expect(summary.topics).toEqual([]);
    expect(summary.keyPoints).toEqual([]);
  });
});
