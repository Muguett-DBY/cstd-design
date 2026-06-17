import type { AssetFilter, AssetItem, ChatMessage, ChatStreamEvent, ImageSize, VideoPreset } from "./types";

export function initialChatDraft() {
  return { content: "", selectedParentId: null as string | null };
}

export function appendChatEvent(messages: ChatMessage[], event: ChatStreamEvent): ChatMessage[] {
  if (event.type === "meta") return messages;
  return messages.map((message) => {
    if (message.id !== event.assistantMessageId) return message;
    if (event.type === "delta") return { ...message, content: message.content + event.content, status: "streaming" };
    if (event.type === "done") return { ...message, status: "complete" };
    if (event.type === "error") {
      const suffix = `\n\n（已中断：${event.error}）`;
      return { ...message, content: message.content ? message.content + suffix : event.error, status: "interrupted" };
    }
    return message;
  });
}

export function filterAssets(assets: AssetItem[], filter: AssetFilter) {
  if (filter === "all") return assets;
  return assets.filter((asset) => asset.kind === filter);
}

export function videoPresetToRequest(preset: VideoPreset) {
  if (preset === "short") return { preset, numFrames: 121, approxSeconds: 5 };
  if (preset === "max") return { preset, numFrames: 441, approxSeconds: 18 };
  return { preset, numFrames: 241, approxSeconds: 10 };
}

export function buildActiveBranch(messages: ChatMessage[], leafId?: string | null) {
  const target = leafId || messages.at(-1)?.id;
  if (!target) return [];
  const byId = new Map(messages.map((message) => [message.id, message]));
  const branch: ChatMessage[] = [];
  let cursor = byId.get(target);
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    branch.push(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return branch.reverse();
}

export function formatBytes(value: number) {
  if (!value) return "未知大小";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const IMAGE_SIZES: ImageSize[] = ["1024x1024", "1024x768", "768x1024"];
const IMAGE_SIZE_STORAGE_KEY = "cstd-design:imageSize";

export function readStoredImageSize() {
  const stored = localStorage.getItem(IMAGE_SIZE_STORAGE_KEY);
  return IMAGE_SIZES.includes(stored as ImageSize) ? (stored as ImageSize) : "1024x1024";
}

export function branchLeaves(messages: ChatMessage[]) {
  const parents = new Set(messages.map((message) => message.parentId).filter(Boolean));
  return messages.filter((message) => message.role === "assistant" && !parents.has(message.id));
}

export function imageAssetsForReference(assets: AssetItem[]) {
  return assets.filter((asset) => asset.mediaType.startsWith("image/"));
}
