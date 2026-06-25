import { useState } from "react";
import { CheckCircle2, Clock, Film, RotateCcw, Trash2, X } from "lucide-react";
import type { CreationRecoveryRecord } from "../hooks/useCreationRecovery";
import type { PersistedVideoTask } from "../hooks/useVideoTaskPersistence";
import type { VideoTaskHistoryEntry } from "../hooks/useVideoTaskHistory";

function recoveryTypeLabel(type: CreationRecoveryRecord["type"]) {
  if (type === "chat") return "咨询";
  if (type === "image") return "图片";
  return "视频";
}

function formatRecoveryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function RecoveryCenter({
  records,
  activeVideoTask,
  recentVideoTasks = [],
  onSelect,
  onDismiss,
  onClear,
  onOpenVideoTask,
}: {
  records: CreationRecoveryRecord[];
  activeVideoTask?: PersistedVideoTask | null;
  recentVideoTasks?: VideoTaskHistoryEntry[];
  onSelect: (record: CreationRecoveryRecord) => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
  onOpenVideoTask?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasActiveVideoTask = Boolean(activeVideoTask && (activeVideoTask.status === "queued" || activeVideoTask.status === "in_progress"));
  const activeCount = hasActiveVideoTask ? 1 : 0;
  const totalCount = activeCount + records.length;
  const hasPanelContent = hasActiveVideoTask || records.length > 0 || recentVideoTasks.length > 0;

  return (
    <div className="recovery-center">
      <button
        type="button"
        className="recovery-trigger"
        aria-label={`创作中心，${activeCount} 个进行中，${records.length} 个可恢复`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <RotateCcw size={16} />
        <span>创作中心</span>
        <span className="recovery-badge">{totalCount}</span>
      </button>
      {open && (
        <section className="recovery-panel" role="dialog" aria-label="创作中心">
          <div className="recovery-panel-header">
            <div>
              <h3>创作中心</h3>
              <p>查看进行中的任务、可恢复的失败创作和最近的视频结果。</p>
            </div>
            <button type="button" className="icon-button" aria-label="关闭创作中心" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          {!hasPanelContent ? (
            <p className="recovery-empty">暂无需要恢复的创作任务。</p>
          ) : (
            <>
              {hasActiveVideoTask && activeVideoTask && (
                <article className="recovery-item recovery-item-active">
                  <div>
                    <span className="recovery-kind"><Clock size={12} /> 进行中</span>
                    <h4>视频正在生成</h4>
                    <p>{activeVideoTask.status === "queued" ? "排队中" : `${activeVideoTask.progress}%`} · 任务 {activeVideoTask.id.slice(0, 8)}</p>
                  </div>
                  <div className="recovery-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      aria-label="查看当前视频任务"
                      onClick={() => {
                        onOpenVideoTask?.();
                        setOpen(false);
                      }}
                    >
                      查看任务
                    </button>
                  </div>
                </article>
              )}
              {records.length > 0 && (
                <>
                  <div className="recovery-list" role="list">
                    {records.map((record) => (
                      <article key={record.id} className="recovery-item" role="listitem">
                        <div>
                          <span className="recovery-kind">{recoveryTypeLabel(record.type)}</span>
                          <h4>{record.label}</h4>
                          <p>{record.summary}</p>
                          <time dateTime={record.createdAt}>{formatRecoveryTime(record.createdAt)}</time>
                        </div>
                        <div className="recovery-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            aria-label={`打开 ${record.label}`}
                            onClick={() => {
                              onSelect(record);
                              setOpen(false);
                            }}
                          >
                            打开
                          </button>
                          <button
                            type="button"
                            className="ghost-button danger"
                            aria-label={`忽略 ${record.label}`}
                            onClick={() => onDismiss(record.id)}
                          >
                            忽略
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <button type="button" className="ghost-button danger recovery-clear" aria-label="清空恢复记录" onClick={onClear}>
                    <Trash2 size={14} /> 清空恢复记录
                  </button>
                </>
              )}
              {recentVideoTasks.length > 0 && (
                <div className="recovery-recent">
                  <h4><Film size={14} /> 最近视频结果</h4>
                  {recentVideoTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="recovery-recent-item">
                      <CheckCircle2 size={14} />
                      <span>{task.prompt.slice(0, 40)}{task.prompt.length > 40 ? "…" : ""}</span>
                      {task.assetUrl && (
                        <a href={task.assetUrl} target="_blank" rel="noreferrer">
                          打开
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
