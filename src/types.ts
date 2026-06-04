export type WorkspaceTab = "chat" | "image" | "video" | "assets";
export type ClearScope = WorkspaceTab;

export interface ConversationSummary {
  id: string;
  title: string;
  activeLeafId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "complete" | "interrupted" | "streaming";
  parentId?: string | null;
  createdAt?: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}

export interface AssetItem {
  id: string;
  kind: "upload" | "image" | "video";
  mediaType: string;
  filename: string;
  size: number;
  createdAt: string;
  url: string;
}

export type AssetFilter = "all" | "image" | "video" | "upload";
export type ImageSize = "1024x1024" | "1024x768" | "768x1024";
export type VideoPreset = "short" | "standard" | "max";

export type ChatStreamEvent =
  | { type: "meta"; conversationId: string; userMessageId: string; assistantMessageId: string; truncated: boolean }
  | { type: "delta"; assistantMessageId: string; content: string }
  | { type: "done"; assistantMessageId: string }
  | { type: "error"; assistantMessageId: string; error: string };
