import { describe, expect, test } from "vitest";
import { buildConversationExport, validateImportContent } from "./conversationExport";
import type { ChatMessage, ConversationSummary } from "../types";

function makeConv(id: string, title: string): ConversationSummary {
  return {
    id,
    title,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    activeLeafId: null,
  };
}

function makeMsg(id: string, role: "user" | "assistant", content: string): ChatMessage {
  return {
    id,
    role,
    content,
    status: "complete",
    createdAt: "2026-01-01T12:00:00Z",
  };
}

describe("buildConversationExport", () => {
  test("builds export with messages", () => {
    const convs = [makeConv("c1", "Test")];
    const messageMap = {
      c1: [makeMsg("m1", "user", "Hello"), makeMsg("m2", "assistant", "Hi")],
    };

    const result = buildConversationExport(convs, messageMap);
    expect(result.version).toBe(1);
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].messages).toHaveLength(2);
    expect(result.conversations[0].title).toBe("Test");
  });

  test("filters out streaming messages", () => {
    const convs = [makeConv("c1", "Test")];
    const messageMap = {
      c1: [
        makeMsg("m1", "user", "Hello"),
        { ...makeMsg("m2", "assistant", ""), status: "streaming" as const },
      ],
    };

    const result = buildConversationExport(convs, messageMap);
    expect(result.conversations[0].messages).toHaveLength(1);
  });

  test("skips conversations with no messages", () => {
    const convs = [makeConv("c1", "Empty"), makeConv("c2", "Has Messages")];
    const messageMap = {
      c1: [],
      c2: [makeMsg("m1", "user", "Hello")],
    };

    const result = buildConversationExport(convs, messageMap);
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].id).toBe("c2");
  });

  test("includes parentId for messages", () => {
    const convs = [makeConv("c1", "Test")];
    const messageMap = {
      c1: [{ ...makeMsg("m1", "user", "Hello"), parentId: "parent1" }],
    };

    const result = buildConversationExport(convs, messageMap);
    expect(result.conversations[0].messages[0].parentId).toBe("parent1");
  });
});

describe("validateImportContent", () => {
  test("validates correct JSON", () => {
    const data = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      conversations: [],
    };
    const result = validateImportContent(JSON.stringify(data));
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
  });

  test("rejects invalid JSON", () => {
    const result = validateImportContent("not json");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("无法解析 JSON");
  });

  test("rejects wrong version", () => {
    const data = { version: 2, conversations: [] };
    const result = validateImportContent(JSON.stringify(data));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("不支持的版本");
  });

  test("rejects missing conversations array", () => {
    const data = { version: 1, conversations: "not array" };
    const result = validateImportContent(JSON.stringify(data));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("无效的对话数据");
  });
});
