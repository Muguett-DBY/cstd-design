export type E2EExportFixtureMessage = {
  role: "user" | "assistant";
  content: string;
};

export type E2EExportFixture = {
  title: string;
  messages: E2EExportFixtureMessage[];
};

export function buildE2EExportFixture(label = "固定样例"): E2EExportFixture {
  const safeLabel = label.replace(/\s+/g, " ").trim().slice(0, 48) || "固定样例";
  return {
    title: `E2E 导出验证 - ${safeLabel}`,
    messages: [
      {
        role: "user",
        content: "请生成一段用于高级导出验证的短内容，包含 Markdown、PDF 与预览检查关键词。",
      },
      {
        role: "assistant",
        content: "这是用于高级导出浏览器冒烟的固定回复。它应当出现在预览区域，并支持 Markdown 与 PDF 文件名检查。",
      },
    ],
  };
}
