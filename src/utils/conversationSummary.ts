import type { ChatMessage } from "../types";

interface ConversationSummary {
  title: string;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  duration: string;
  keyPoints: string[];
  topics: string[];
}

function getDuration(messages: ChatMessage[]): string {
  const dates = messages
    .filter((m): m is ChatMessage & { createdAt: string } => !!m.createdAt)
    .map((m) => new Date(m.createdAt).getTime());

  if (dates.length < 2) return "";

  const start = new Date(Math.min(...dates));
  const end = new Date(Math.max(...dates));
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins} 分钟`;
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  return `${diffHours} 小时${remainingMins > 0 ? ` ${remainingMins} 分钟` : ""}`;
}

const EXTRACT_PATTERNS = [
  /(?:我认为|我觉得|我的想法是|在我看来)[：:]\s*(.+?)[。.!！?？]|(?:我认为|我觉得|我的想法是|在我看来)\s(.+?)(?=\n|$)/g,
  /(?:建议|推荐|提出)[：:]\s*(.+?)[。.!！]|(?:建议|推荐|提出)\s(.+?)(?=\n|$)/g,
  /(?:总结|总之|综上所述|因此)[：:,，]\s*(.+?)[。.!！]|(?:总结|总之|综上所述|因此)\s(.+?)(?=\n|$)/g,
  /(?:问题|挑战|难点)[：:]\s*(.+?)[。.!！?？]|(?:问题|挑战|难点)\s(.+?)(?=\n|$)/g,
  /(?:方案|方法|解决)[：:]\s*(.+?)[。.!！]|(?:方案|方法|解决)\s(.+?)(?=\n|$)/g,
];

function extractKeyPoints(content: string): string[] {
  const points = new Set<string>();

  for (const pattern of EXTRACT_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const point = (match[1] || match[2] || "").trim();
      if (point.length > 5 && point.length < 200) {
        points.add(point);
      }
    }
  }

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("1. ")) && trimmed.length > 10 && trimmed.length < 200) {
      points.add(trimmed.replace(/^[-*\d.。]+\s*/, ""));
    }
  }

  return Array.from(points).slice(0, 8);
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "代码开发": ["代码", "函数", "API", "bug", "调试", "编程", "开发", "部署", "git"],
  "设计": ["设计", "UI", "界面", "颜色", "布局", "视觉"],
  "数据分析": ["数据", "分析", "统计", "趋势", "图表"],
  "文档写作": ["文档", "写作", "文章", "报告", "总结"],
  "项目管理": ["项目", "计划", "任务", "进度", "需求"],
  "技术问题": ["错误", "问题", "失败", "异常", "错误处理"],
  "学习": ["学习", "教程", "理解", "解释", "概念"],
};

function extractTopics(content: string): string[] {
  const topics = new Set<string>();
  const lowerContent = content.toLowerCase();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerContent.includes(kw)) {
        topics.add(topic);
        break;
      }
    }
  }

  return Array.from(topics);
}

export function generateConversationSummary(messages: ChatMessage[], title: string): ConversationSummary {
  const userMessages = messages.filter((m) => m.role === "user" && m.status !== "streaming");
  const assistantMessages = messages.filter((m) => m.role === "assistant" && m.status !== "streaming");

  const allContent = messages
    .filter((m) => m.status !== "streaming")
    .map((m) => m.content)
    .join("\n");

  const keyPoints = extractKeyPoints(allContent);
  const topics = extractTopics(allContent);

  return {
    title,
    messageCount: messages.length,
    userMessageCount: userMessages.length,
    assistantMessageCount: assistantMessages.length,
    duration: getDuration(messages),
    keyPoints,
    topics,
  };
}
