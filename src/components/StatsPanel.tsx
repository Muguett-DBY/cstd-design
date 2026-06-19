import { useMemo } from "react";
import { BarChart3, Folder, Image as ImageIcon, MessageSquare, Video } from "lucide-react";
import { formatBytes } from "../app-state";
import type { AssetItem, ChatMessage, ConversationSummary } from "../types";

interface Stats {
  conversationCount: number;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  assetCount: number;
  imageCount: number;
  videoCount: number;
  uploadCount: number;
  totalSize: number;
  messagesPerDay: { date: string; count: number }[];
  assetsByKind: { kind: string; count: number; size: number }[];
}

function computeStats(
  conversations: ConversationSummary[],
  messages: ChatMessage[],
  assets: AssetItem[],
): Stats {
  const conversationCount = conversations.length;
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const assistantMessageCount = messages.filter((m) => m.role === "assistant").length;
  const messageCount = messages.length;
  const imageCount = assets.filter((a) => a.kind === "image").length;
  const videoCount = assets.filter((a) => a.kind === "video").length;
  const uploadCount = assets.filter((a) => a.kind === "upload").length;
  const totalSize = assets.reduce((sum, a) => sum + a.size, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  for (const m of messages) {
    if (!m.createdAt) continue;
    const dStr = new Date(m.createdAt).toISOString().slice(0, 10);
    const day = days.find((d) => d.date === dStr);
    if (day) day.count++;
  }

  const kindMap = new Map<string, { count: number; size: number }>();
  for (const a of assets) {
    const existing = kindMap.get(a.kind) || { count: 0, size: 0 };
    kindMap.set(a.kind, { count: existing.count + 1, size: existing.size + a.size });
  }
  const assetsByKind = Array.from(kindMap.entries()).map(([kind, v]) => ({ kind, ...v }));

  return {
    conversationCount, messageCount, userMessageCount, assistantMessageCount,
    assetCount: assets.length, imageCount, videoCount, uploadCount, totalSize,
    messagesPerDay: days, assetsByKind,
  };
}

export function StatsPanel({
  conversations,
  messages,
  assets,
}: {
  conversations: ConversationSummary[];
  messages: ChatMessage[];
  assets: AssetItem[];
}) {
  const stats = useMemo(() => computeStats(conversations, messages, assets), [conversations, messages, assets]);
  const maxDay = Math.max(1, ...stats.messagesPerDay.map((d) => d.count));

  return (
    <div className="stats-panel" role="region" aria-label="使用统计">
      <h3><BarChart3 size={16} /> 使用统计</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><MessageSquare size={18} /></div>
          <div className="stat-content">
            <span className="stat-value">{stats.messageCount}</span>
            <span className="stat-label">消息</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Folder size={18} /></div>
          <div className="stat-content">
            <span className="stat-value">{stats.conversationCount}</span>
            <span className="stat-label">会话</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ImageIcon size={18} /></div>
          <div className="stat-content">
            <span className="stat-value">{stats.imageCount}</span>
            <span className="stat-label">图片</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Video size={18} /></div>
          <div className="stat-content">
            <span className="stat-value">{stats.videoCount}</span>
            <span className="stat-label">视频</span>
          </div>
        </div>
      </div>
      <div className="stats-storage">
        <span className="stats-storage-label">总占用</span>
        <span className="stats-storage-value">{formatBytes(stats.totalSize)}</span>
      </div>
      <div className="stats-chart">
        <div className="stats-chart-title">近 7 天消息</div>
        <div className="stats-chart-bars" role="img" aria-label="近 7 天消息数">
          {stats.messagesPerDay.map((d) => {
            const height = d.count === 0 ? 2 : Math.max(4, (d.count / maxDay) * 60);
            return (
              <div key={d.date} className="stats-chart-bar-wrapper" title={`${d.date}: ${d.count} 条`}>
                <div className="stats-chart-bar" style={{ height: `${height}px` }} />
                <span className="stats-chart-label">{d.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="stats-breakdown">
        <div className="stats-breakdown-title">素材分布</div>
        {stats.assetsByKind.length === 0 ? (
          <div className="stats-breakdown-empty">暂无素材</div>
        ) : (
          stats.assetsByKind.map((k) => (
            <div key={k.kind} className="stats-breakdown-row">
              <span className="stats-breakdown-label">{k.kind}</span>
              <span className="stats-breakdown-count">{k.count}</span>
              <span className="stats-breakdown-size">{formatBytes(k.size)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
