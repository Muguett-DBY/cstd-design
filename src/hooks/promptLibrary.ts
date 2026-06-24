export type PromptCategory = "writing" | "coding" | "analysis" | "creative" | "translation" | "education" | "business" | "custom";

export interface LibraryPrompt {
  id: string;
  text: string;
  category: PromptCategory;
  icon: string;
  isFavorite: boolean;
  useCount: number;
  lastUsedAt: number | null;
  createdAt: number;
}

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  writing: "写作",
  coding: "编程",
  analysis: "分析",
  creative: "创意",
  translation: "翻译",
  education: "教育",
  business: "商业",
  custom: "自定义",
};

const CATEGORY_ICONS: Record<PromptCategory, string> = {
  writing: "✍️",
  coding: "💻",
  analysis: "📊",
  creative: "🎨",
  translation: "🌐",
  education: "📚",
  business: "💼",
  custom: "⭐",
};

const SEED_PROMPTS: Omit<LibraryPrompt, "id" | "isFavorite" | "useCount" | "lastUsedAt" | "createdAt">[] = [
  { text: "帮我写一段产品介绍文案", category: "writing", icon: "💡" },
  { text: "解释一下这段代码的逻辑", category: "coding", icon: "🔍" },
  { text: "给这个项目起 3 个候选名字", category: "creative", icon: "✨" },
  { text: "总结以下内容的要点", category: "analysis", icon: "📝" },
  { text: "翻译成英文", category: "translation", icon: "🌐" },
  { text: "给我一些配色建议", category: "creative", icon: "🎨" },
  { text: "分析数据并给出建议", category: "analysis", icon: "📊" },
  { text: "帮我润色一下这段文字", category: "writing", icon: "✍️" },
  { text: "对比这几个方案的优缺点", category: "analysis", icon: "🤔" },
  { text: "给我一些创意灵感", category: "creative", icon: "💡" },
  { text: "解释一个概念，从简单到深入", category: "education", icon: "📚" },
  { text: "帮我调试这段代码", category: "coding", icon: "🔧" },
  { text: "写一份商业计划书大纲", category: "business", icon: "💼" },
  { text: "帮我写一封正式邮件", category: "writing", icon: "📧" },
  { text: "优化这段代码的性能", category: "coding", icon: "⚡" },
  { text: "翻译成日语", category: "translation", icon: "🌏" },
  { text: "设计一个数据库 schema", category: "coding", icon: "🗄️" },
  { text: "写一段广告文案", category: "business", icon: "📢" },
  { text: "解释这个 API 的用法", category: "coding", icon: "📖" },
  { text: "帮我写演讲稿", category: "writing", icon: "🎤" },
];

export function getSeedPrompts(): LibraryPrompt[] {
  return SEED_PROMPTS.map((p, i) => ({
    ...p,
    id: `seed-${i}`,
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    createdAt: Date.now(),
  }));
}

export { CATEGORY_LABELS, CATEGORY_ICONS };
