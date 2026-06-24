import type { AssetItem, ChatMessage, ConversationSummary } from "../types";

interface AnalyticsData {
  conversations: number;
  messages: number;
  assets: number;
  images: number;
  videos: number;
  totalSize: number;
  messagesByDay: { date: string; count: number }[];
  assetsByKind: { kind: string; count: number; size: number }[];
}

export function collectAnalytics(
  conversations: ConversationSummary[],
  messages: ChatMessage[],
  assets: AssetItem[]
): AnalyticsData {
  const messagesByDay: Record<string, number> = {};
  const assetsByKind: Record<string, { count: number; size: number }> = {};

  for (const msg of messages) {
    if (!msg.createdAt) continue;
    const date = new Date(msg.createdAt).toISOString().slice(0, 10);
    messagesByDay[date] = (messagesByDay[date] || 0) + 1;
  }

  for (const asset of assets) {
    if (!assetsByKind[asset.kind]) {
      assetsByKind[asset.kind] = { count: 0, size: 0 };
    }
    assetsByKind[asset.kind].count++;
    assetsByKind[asset.kind].size += asset.size;
  }

  return {
    conversations: conversations.length,
    messages: messages.length,
    assets: assets.length,
    images: assets.filter((a) => a.kind === "image").length,
    videos: assets.filter((a) => a.kind === "video").length,
    totalSize: assets.reduce((sum, a) => sum + a.size, 0),
    messagesByDay: Object.entries(messagesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    assetsByKind: Object.entries(assetsByKind)
      .map(([kind, data]) => ({ kind, ...data })),
  };
}

export function exportAsCSV(data: AnalyticsData): string {
  const lines = ["Metric,Value"];
  lines.push(`Conversations,${data.conversations}`);
  lines.push(`Messages,${data.messages}`);
  lines.push(`Assets,${data.assets}`);
  lines.push(`Images,${data.images}`);
  lines.push(`Videos,${data.videos}`);
  lines.push(`Total Size (bytes),${data.totalSize}`);
  lines.push("");
  lines.push("Date,Message Count");
  for (const row of data.messagesByDay) {
    lines.push(`${row.date},${row.count}`);
  }
  lines.push("");
  lines.push("Kind,Count,Size (bytes)");
  for (const row of data.assetsByKind) {
    lines.push(`${row.kind},${row.count},${row.size}`);
  }
  return lines.join("\n");
}

export function exportAsJSON(data: AnalyticsData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadAnalytics(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
