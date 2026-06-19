const PROMPT_STARTERS = [
  { icon: "💡", text: "帮我写一段产品介绍文案" },
  { icon: "🔍", text: "解释一下这段代码的逻辑" },
  { icon: "✨", text: "给这个项目起 3 个候选名字" },
  { icon: "📝", text: "总结以下内容的要点" },
  { icon: "🌐", text: "翻译成英文" },
  { icon: "🎨", text: "给我一些配色建议" },
  { icon: "📊", text: "分析数据并给出建议" },
  { icon: "✍️", text: "帮我润色一下这段文字" },
  { icon: "🤔", text: "对比这几个方案的优缺点" },
  { icon: "💡", text: "给我一些创意灵感" },
  { icon: "📚", text: "解释一个概念，从简单到深入" },
  { icon: "🔧", text: "帮我调试这段代码" },
];

const CONTEXTUAL_FOLLOWUPS = [
  "能再详细解释一下吗？",
  "给我一个具体的例子",
  "有没有其他方案？",
  "这些方案的优缺点是什么？",
  "我应该选择哪个？",
  "用更简单的语言重新解释",
  "用代码展示一下",
  "可视化这个概念",
];

export function getPromptStarters() {
  return PROMPT_STARTERS;
}

export function getContextualFollowups() {
  return CONTEXTUAL_FOLLOWUPS;
}

export function getRandomStarters(count: number = 4) {
  const shuffled = [...PROMPT_STARTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
