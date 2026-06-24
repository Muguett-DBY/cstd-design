export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  initialPrompt: string;
  category: "general" | "coding" | "writing" | "analysis" | "creative";
}

export const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  {
    id: "code-review",
    name: "代码审查",
    description: "审查代码质量、安全性和最佳实践",
    icon: "🔍",
    initialPrompt: "请审查以下代码，关注代码质量、安全性和最佳实践：\n\n```代码粘贴于此```",
    category: "coding",
  },
  {
    id: "bug-fix",
    name: "Bug 修复",
    description: "分析和修复代码中的错误",
    icon: "🐛",
    initialPrompt: "我遇到了一个 bug：\n\n错误描述：\n相关代码：\n期望行为：\n实际行为：\n\n请帮我分析原因并提供修复方案。",
    category: "coding",
  },
  {
    id: "explain-code",
    name: "代码解释",
    description: "解释代码逻辑和工作原理",
    icon: "📖",
    initialPrompt: "请解释以下代码的工作原理，包括：\n1. 主要功能\n2. 关键步骤\n3. 设计模式\n\n```代码粘贴于此```",
    category: "coding",
  },
  {
    id: "write-article",
    name: "写文章",
    description: "撰写文章或博客内容",
    icon: "✍️",
    initialPrompt: "请帮我写一篇关于以下主题的文章：\n\n主题：\n目标读者：\n文章长度：\n语气风格：",
    category: "writing",
  },
  {
    id: "translate",
    name: "翻译",
    description: "翻译文本到目标语言",
    icon: "🌐",
    initialPrompt: "请将以下内容翻译成目标语言，保持原文风格和语气：\n\n源语言：\n目标语言：\n\n原文：",
    category: "writing",
  },
  {
    id: "summarize",
    name: "内容总结",
    description: "总结长文本的要点",
    icon: "📝",
    initialPrompt: "请总结以下内容的要点，使用简洁的列表形式：\n\n",
    category: "analysis",
  },
  {
    id: "brainstorm",
    name: "头脑风暴",
    description: "生成创意想法和方案",
    icon: "💡",
    initialPrompt: "我需要为以下问题/项目进行头脑风暴：\n\n问题/项目：\n目标：\n约束条件：\n\n请提供 5-10 个创意方案。",
    category: "creative",
  },
  {
    id: "data-analysis",
    name: "数据分析",
    description: "分析数据并提供洞察",
    icon: "📊",
    initialPrompt: "请分析以下数据，提供：\n1. 关键发现\n2. 趋势分析\n3. 建议措施\n\n数据：",
    category: "analysis",
  },
];

export function getTemplatesByCategory(category: ConversationTemplate["category"]): ConversationTemplate[] {
  return CONVERSATION_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): ConversationTemplate | undefined {
  return CONVERSATION_TEMPLATES.find((t) => t.id === id);
}
