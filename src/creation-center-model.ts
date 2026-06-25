import type { VideoTaskHistoryEntry } from "./hooks/useVideoTaskHistory";
import type { AssetItem, ConversationSummary } from "./types";

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function deriveCreationCenterHighlights({
  conversations,
  assets,
  videoHistory,
}: {
  conversations: ConversationSummary[];
  assets: AssetItem[];
  videoHistory: VideoTaskHistoryEntry[];
}) {
  const latestConversation = [...conversations].sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt))[0];
  const latestImage = assets
    .filter((asset) => asset.kind === "image")
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))[0];
  const completedVideoTasks = videoHistory
    .filter((task) => task.status === "completed")
    .sort((a, b) => timestamp(b.finishedAt) - timestamp(a.finishedAt));

  return { latestConversation, latestImage, completedVideoTasks };
}
