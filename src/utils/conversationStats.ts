import type { ChatMessage } from "../types";
import { generateConversationSummary } from "../utils/conversationSummary";

interface ConversationStats {
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  totalChars: number;
  estimatedTokens: number;
  avgMessageLength: number;
  duration: string;
  userCharRatio: number;
  topics: string[];
  keyPoints: string[];
}

export function computeConversationStats(messages: ChatMessage[], title: string): ConversationStats {
  const valid = messages.filter((m) => m.status !== "streaming");
  const userMsgs = valid.filter((m) => m.role === "user");
  const assistantMsgs = valid.filter((m) => m.role === "assistant");
  const totalChars = valid.reduce((s, m) => s + m.content.length, 0);
  const userChars = userMsgs.reduce((s, m) => s + m.content.length, 0);

  const summary = generateConversationSummary(messages, title);

  return {
    messageCount: valid.length,
    userMessages: userMsgs.length,
    assistantMessages: assistantMsgs.length,
    totalChars,
    estimatedTokens: Math.ceil(totalChars / 4),
    avgMessageLength: valid.length > 0 ? Math.round(totalChars / valid.length) : 0,
    duration: summary.duration,
    userCharRatio: totalChars > 0 ? Math.round((userChars / totalChars) * 100) : 0,
    topics: summary.topics,
    keyPoints: summary.keyPoints,
  };
}
