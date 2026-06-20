type EnhanceMode = "rewrite" | "expand" | "formal" | "casual" | "shorten";

const TONE_MAP: Record<string, { formal: string; casual: string }> = {
  "你": { formal: "您", casual: "你" },
  "请": { formal: "恳请", casual: "请" },
  "好的": { formal: "确认收到", casual: "好的" },
  "可以": { formal: "是否能够", casual: "可以" },
  "需要": { formal: "需要", casual: "要" },
  "帮我": { formal: "协助我", casual: "帮我" },
  "怎么做": { formal: "如何实现", casual: "怎么做" },
  "什么": { formal: "哪些", casual: "什么" },
};

function formalize(text: string): string {
  let result = text;
  for (const [key, val] of Object.entries(TONE_MAP)) {
    result = result.replaceAll(key, val.formal);
  }
  return result;
}

function casualize(text: string): string {
  let result = text;
  for (const [key, val] of Object.entries(TONE_MAP)) {
    result = result.replaceAll(key, val.casual);
  }
  return result;
}

function expandPrompt(text: string): string {
  const trimmed = text.trim();
  if (trimmed.endsWith("。") || trimmed.endsWith(".") || trimmed.endsWith("！") || trimmed.endsWith("!")) {
    return `${trimmed.slice(0, -1)}，并且请详细说明具体步骤和注意事项。`;
  }
  return `${trimmed}，请详细说明具体步骤和注意事项。`;
}

function rewritePrompt(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 5) return trimmed;
  const prefixes = ["请帮我", "我想", "帮我", "需要"];
  const hasPrefix = prefixes.some((p) => trimmed.startsWith(p));
  if (hasPrefix) return trimmed;
  if (trimmed.includes("？") || trimmed.includes("?")) {
    return `我想了解${trimmed}`;
  }
  return `请帮我${trimmed}`;
}

function shortenPrompt(text: string): string {
  return text
    .replace(/[，,。.！!？?；;：:、]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export function enhancePrompt(text: string, mode: EnhanceMode): string {
  switch (mode) {
    case "rewrite": return rewritePrompt(text);
    case "expand": return expandPrompt(text);
    case "formal": return formalize(text);
    case "casual": return casualize(text);
    case "shorten": return shortenPrompt(text);
    default: return text;
  }
}

export type { EnhanceMode };
