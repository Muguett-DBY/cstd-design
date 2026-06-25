import { useState } from "react";
import { CheckCircle2, CircleX, Clock, Film, History, Image as ImageIcon, MessageSquare, RotateCcw, Trash2, X } from "lucide-react";
import type { CreationRecoveryRecord } from "../hooks/useCreationRecovery";
import type { CreationActivity } from "../hooks/useCreationActivity";
import type { PersistedVideoTask } from "../hooks/useVideoTaskPersistence";
import type { VideoTaskHistoryEntry } from "../hooks/useVideoTaskHistory";
import type { AssetItem, ConversationSummary, WorkspaceTab } from "../types";

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

function activityTypeMeta(type: CreationActivity["type"]) {
  if (type === "completed") return { label: "已完成", icon: CheckCircle2 };
  if (type === "ignored") return { label: "已忽略", icon: CircleX };
  return { label: "已恢复", icon: RotateCcw };
}

export function RecoveryCenter({
  records,
  activeVideoTask,
  recentVideoTasks = [],
  recentConversation,
  recentImage,
  activities = [],
  onSelect,
  onDismiss,
  onClear,
  onOpenVideoTask,
  onContinueConversation,
  onOpenRecentImage,
  onStartWorkspace,
  onClearActivity,
}: {
  records: CreationRecoveryRecord[];
  activeVideoTask?: PersistedVideoTask | null;
  recentVideoTasks?: VideoTaskHistoryEntry[];
  recentConversation?: ConversationSummary;
  recentImage?: AssetItem;
  activities?: CreationActivity[];
  onSelect: (record: CreationRecoveryRecord) => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
  onOpenVideoTask?: () => void;
  onContinueConversation?: (id: string) => void;
  onOpenRecentImage?: (asset: AssetItem) => void;
  onStartWorkspace?: (workspace: WorkspaceTab) => void;
  onClearActivity?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasActiveVideoTask = Boolean(activeVideoTask && (activeVideoTask.status === "queued" || activeVideoTask.status === "in_progress"));
  const activeCount = hasActiveVideoTask ? 1 : 0;
  const totalCount = activeCount + records.length;
  const hasPanelContent = hasActiveVideoTask || records.length > 0 || recentVideoTasks.length > 0;
  const triggerClassName = `recovery-trigger${totalCount > 0 ? " has-recovery-work" : ""}`;
  const runAndClose = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <div className="recovery-center">
      <button
        type="button"
        className={triggerClassName}
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
          <>
            <div className="recovery-overview" aria-label="创作中心状态概览">
              <div className="recovery-overview-card">
                <span>进行中</span>
                <strong>{activeCount}</strong>
              </div>
              <div className="recovery-overview-card">
                <span>可恢复</span>
                <strong>{records.length}</strong>
              </div>
              <div className="recovery-overview-card">
                <span>最近完成</span>
                <strong>{recentVideoTasks.length}</strong>
              </div>
            </div>
            <section className="recovery-continuation" aria-label="继续创作">
              <div className="recovery-section-heading">
                <h4>继续创作</h4>
                <span>从最近进度快速接上</span>
              </div>
              <div className="recovery-continuation-grid">
                <article className="recovery-continuation-card">
                  <MessageSquare size={16} />
                  <div>
                    <span>最近对话</span>
                    <strong>{recentConversation?.title || "开始新的咨询"}</strong>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    aria-label={recentConversation ? "继续最近对话" : "开始咨询创作"}
                    onClick={() => runAndClose(() => {
                      if (recentConversation) onContinueConversation?.(recentConversation.id);
                      else onStartWorkspace?.("chat");
                    })}
                  >
                    {recentConversation ? "继续" : "开始"}
                  </button>
                </article>
                <article className="recovery-continuation-card">
                  <ImageIcon size={16} />
                  <div>
                    <span>最近图片</span>
                    <strong>{recentImage?.filename || "创建第一张图片"}</strong>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    aria-label={recentImage ? "查看最近图片" : "开始图片创作"}
                    onClick={() => runAndClose(() => {
                      if (recentImage) onOpenRecentImage?.(recentImage);
                      else onStartWorkspace?.("image");
                    })}
                  >
                    {recentImage ? "查看" : "开始"}
                  </button>
                </article>
                <article className="recovery-continuation-card">
                  <Film size={16} />
                  <div>
                    <span>视频工作区</span>
                    <strong>{hasActiveVideoTask ? "任务正在处理中" : "创建或查看视频"}</strong>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    aria-label="开始视频创作"
                    onClick={() => runAndClose(() => onStartWorkspace?.("video"))}
                  >
                    进入
                  </button>
                </article>
              </div>
            </section>
            {!hasPanelContent && <p className="recovery-empty">暂无需要恢复的创作任务。</p>}
            {hasPanelContent && (
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
            {activities.length > 0 && (
              <section className="recovery-activity" aria-label="近期创作活动">
                <div className="recovery-activity-heading">
                  <h4><History size={14} /> 近期活动</h4>
                  <button type="button" className="ghost-button" aria-label="清空创作活动" onClick={onClearActivity}>
                    清空
                  </button>
                </div>
                <div className="recovery-activity-list">
                  {activities.slice(0, 5).map((activity) => {
                    const meta = activityTypeMeta(activity.type);
                    const Icon = meta.icon;
                    return (
                      <div key={activity.id} className={`recovery-activity-item activity-${activity.type}`}>
                        <Icon size={14} />
                        <div>
                          <strong>{activity.label}</strong>
                          <span>{meta.label} · {formatRecoveryTime(activity.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        </section>
      )}
    </div>
  );
}
