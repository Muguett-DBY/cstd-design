import { describe, expect, test } from "vitest";
import { enhancePrompt, type EnhanceMode } from "./usePromptEnhance";

describe("enhancePrompt", () => {
  test("rewrite adds prefix to plain text", () => {
    const result = enhancePrompt("写一段代码", "rewrite");
    expect(result).toBe("请帮我写一段代码");
  });

  test("rewrite does not double-prefix", () => {
    const result = enhancePrompt("请帮我写代码", "rewrite");
    expect(result).toBe("请帮我写代码");
  });

  test("rewrite wraps questions", () => {
    const result = enhancePrompt("什么是API？", "rewrite");
    expect(result).toBe("我想了解什么是API？");
  });

  test("expand adds detail request", () => {
    const result = enhancePrompt("帮我分析数据", "expand");
    expect(result).toContain("请详细说明具体步骤和注意事项");
  });

  test("expand handles ending punctuation", () => {
    const result = enhancePrompt("帮我分析数据。", "expand");
    expect(result).toContain("，并且请详细说明具体步骤和注意事项");
  });

  test("formal replaces casual words", () => {
    const result = enhancePrompt("你帮我怎么做", "formal");
    expect(result).toContain("您");
    expect(result).toContain("如何实现");
  });

  test("casual replaces formal words", () => {
    const result = enhancePrompt("您请协助我", "casual");
    expect(result).toContain("请");
  });

  test("shorten removes punctuation and truncates", () => {
    const result = enhancePrompt("这是一段很长的文本，包含了很多标点符号！", "shorten");
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).not.toContain("，");
    expect(result).not.toContain("！");
  });

  test("returns original for unknown mode", () => {
    const result = enhancePrompt("hello", "unknown" as EnhanceMode);
    expect(result).toBe("hello");
  });
});
