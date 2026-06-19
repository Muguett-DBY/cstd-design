import { CheckCircle2, Clock, Film, Trash2, XCircle } from "lucide-react";
import type { VideoTaskHistoryEntry } from "../hooks/useVideoTaskHistory";

export function VideoTasksPanel({
  history,
  onRemove,
  onClear,
  activeTaskId,
}: {
  history: VideoTaskHistoryEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
  activeTaskId?: string;
}) {
  if (history.length === 0 && !activeTaskId) return null;
  return (
    <div className="video-tasks-panel" role="region" aria-label="视频任务历史">
      <div className="video-tasks-header">
        <strong><Film size={14} /> 视频任务</strong>
        {history.length > 0 && (
          <button type="button" className="ghost-button-small" onClick={onClear} aria-label="清空历史">
            清空
          </button>
        )}
      </div>
      {activeTaskId && (
        <div className="video-task-item video-task-active">
          <Clock size={14} className="video-task-icon" />
          <div className="video-task-content">
            <span className="video-task-prompt">当前任务 {activeTaskId.slice(0, 8)}...</span>
            <span className="video-task-status">进行中</span>
          </div>
        </div>
      )}
      <ul className="video-tasks-list">
        {history.map((t) => {
          const Icon = t.status === "completed" ? CheckCircle2 : t.status === "failed" ? XCircle : Clock;
          return (
            <li key={t.id} className={`video-task-item video-task-${t.status}`}>
              <Icon size={14} className="video-task-icon" />
              <div className="video-task-content">
                <span className="video-task-prompt">{t.prompt.slice(0, 50)}{t.prompt.length > 50 ? "..." : ""}</span>
                <div className="video-task-meta">
                  <span className="video-task-status">
                    {t.status === "completed" ? "完成" : t.status === "failed" ? "失败" : "已放弃"}
                  </span>
                  <span className="video-task-time">{new Date(t.finishedAt).toLocaleString("zh-CN")}</span>
                </div>
              </div>
              {t.assetUrl && (
                <a href={t.assetUrl} className="video-task-link" target="_blank" rel="noopener" title="打开视频">
                  <Film size={12} />
                </a>
              )}
              <button
                type="button"
                className="video-task-remove"
                onClick={() => onRemove(t.id)}
                aria-label="移除任务"
                title="移除"
              >
                <Trash2 size={12} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
