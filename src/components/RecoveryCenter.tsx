import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleX, Clock, Film, History, Image as ImageIcon, MessageSquare, RotateCcw, Trash2, X } from "lucide-react";
import type { CreationRecoveryRecord } from "../hooks/useCreationRecovery";
import type { CreationActivity } from "../hooks/useCreationActivity";
import type { PersistedVideoTask } from "../hooks/useVideoTaskPersistence";
import type { VideoTaskHistoryEntry } from "../hooks/useVideoTaskHistory";
import type { AssetItem, ConversationSummary, WorkspaceTab } from "../types";

type RecoveryCenterSection = "continue" | "tasks" | "activity";
type RecoveryTaskFilter = "all" | "stale" | CreationRecoveryRecord["type"];
const STALE_RECOVERY_MS = 24 * 60 * 60 * 1000;

type RecoveryRecommendation =
  | {
      kind: "active-video";
      title: string;
      detail: string;
      actionLabel: string;
    }
  | {
      kind: "recovery-record";
      title: string;
      detail: string;
      record: CreationRecoveryRecord;
      actionLabel: string;
    }
  | null;

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

function isStaleRecovery(value: string, now = Date.now()) {
  const createdAt = Date.parse(value);
  return Number.isFinite(createdAt) && now - createdAt >= STALE_RECOVERY_MS;
}

function sortWorkspaceRecoveryRecords(records: CreationRecoveryRecord[]) {
  return [...records].sort((a, b) => {
    const aIsStale = isStaleRecovery(a.createdAt);
    const bIsStale = isStaleRecovery(b.createdAt);
    if (aIsStale && bIsStale) return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (aIsStale) return -1;
    if (bIsStale) return 1;
    return 0;
  });
}

function activityTypeMeta(type: CreationActivity["type"]) {
  if (type === "completed") return { label: "已完成", icon: CheckCircle2 };
  if (type === "ignored") return { label: "已忽略", icon: CircleX };
  return { label: "已恢复", icon: RotateCcw };
}

function activityTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const [section, setSection] = useState<RecoveryCenterSection>("continue");
  const [taskFilter, setTaskFilter] = useState<RecoveryTaskFilter>("all");
  const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);
  const hasActiveVideoTask = Boolean(activeVideoTask && (activeVideoTask.status === "queued" || activeVideoTask.status === "in_progress"));
  const activeCount = hasActiveVideoTask ? 1 : 0;
  const totalCount = activeCount + records.length;
  const hasPanelContent = hasActiveVideoTask || records.length > 0 || recentVideoTasks.length > 0;
  const staleRecords = records.filter((record) => isStaleRecovery(record.createdAt));
  const staleQueueRecords = [...staleRecords].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const staleRecoveryCount = staleRecords.length;
  const recentActivities = [...activities].sort((a, b) => activityTimestamp(b.createdAt) - activityTimestamp(a.createdAt));
  const activityOutcomeCounts = recentActivities.reduce(
    (counts, activity) => ({
      ...counts,
      [activity.type]: counts[activity.type] + 1,
    }),
    { completed: 0, restored: 0, ignored: 0 } satisfies Record<CreationActivity["type"], number>,
  );
  const filteredRecords = taskFilter === "all"
    ? records
    : taskFilter === "stale"
      ? staleQueueRecords
      : sortWorkspaceRecoveryRecords(records.filter((record) => record.type === taskFilter));
  const activeWorkspaceStaleCount = taskFilter === "all" || taskFilter === "stale"
    ? 0
    : records.filter((record) => record.type === taskFilter && isStaleRecovery(record.createdAt)).length;
  const showQueuePriorityPrompt = activeWorkspaceStaleCount > 0;
  const showActiveVideoTask = hasActiveVideoTask && (taskFilter === "all" || taskFilter === "video");
  const showRecentVideoTasks = recentVideoTasks.length > 0 && (taskFilter === "all" || taskFilter === "video");
  const hasFilteredTasks = showActiveVideoTask || filteredRecords.length > 0 || showRecentVideoTasks;
  const workspaceFilterOptions: Array<{ key: CreationRecoveryRecord["type"]; label: string; count: number; ariaLabel: string }> = [
    { key: "chat", label: "咨询", count: records.filter((record) => record.type === "chat").length, ariaLabel: "只看咨询待处理" },
    { key: "image", label: "图片", count: records.filter((record) => record.type === "image").length, ariaLabel: "只看图片待处理" },
    {
      key: "video",
      label: "视频",
      count: activeCount + records.filter((record) => record.type === "video").length,
      ariaLabel: "只看视频待处理",
    },
  ];
  const taskFilterOptions: Array<{ key: RecoveryTaskFilter; label: string; count: number; ariaLabel: string }> = [
    { key: "all", label: "全部", count: totalCount, ariaLabel: "显示全部待处理" },
    { key: "stale", label: "保存较久", count: staleRecoveryCount, ariaLabel: "只看保存较久的恢复项" },
    ...workspaceFilterOptions,
  ];
  const activeTaskFilter = taskFilterOptions.find((option) => option.key === taskFilter) || taskFilterOptions[0];
  const riskFocus = [...workspaceFilterOptions].sort((a, b) => b.count - a.count)[0];
  const oldestStaleRecord = staleQueueRecords[0];
  const openStaleRecoveries = () => {
    setSection("tasks");
    setTaskFilter("stale");
    setCleanupNotice(null);
  };
  const openOldestStaleRecovery = () => {
    if (!oldestStaleRecord) return;
    onSelect(oldestStaleRecord);
    setOpen(false);
  };
  const dismissOldestStaleRecovery = () => {
    if (!oldestStaleRecord) return;
    onDismiss(oldestStaleRecord.id);
  };
  const dismissAllStaleRecoveries = () => {
    const cleanupCount = staleQueueRecords.length;
    staleQueueRecords.forEach((record) => onDismiss(record.id));
    setTaskFilter("all");
    setCleanupNotice(`已忽略 ${cleanupCount} 项保存较久记录，已切回全部待处理。`);
  };
  const openRiskFocus = () => {
    if (!riskFocus) return;
    setSection("tasks");
    setTaskFilter(riskFocus.key);
    setCleanupNotice(null);
  };
  const selectTaskFilter = (filter: RecoveryTaskFilter) => {
    setTaskFilter(filter);
    setCleanupNotice(null);
  };
  const triggerClassName = `recovery-trigger${totalCount > 0 ? " has-recovery-work" : ""}`;
  const toggleOpen = () => {
    if (!open) setSection(hasPanelContent ? "tasks" : "continue");
    setOpen((current) => !current);
  };
  const runAndClose = (action: () => void) => {
    action();
    setOpen(false);
  };
  const recommendation: RecoveryRecommendation = hasActiveVideoTask && activeVideoTask
    ? {
        kind: "active-video",
        title: "视频正在生成",
        detail: activeVideoTask.status === "queued" ? "排队中，建议先查看当前任务状态。" : `${activeVideoTask.progress}% · 建议先查看当前任务状态。`,
        actionLabel: "查看建议任务",
      }
    : records.length > 0
      ? {
          kind: "recovery-record",
          title: records[0].label,
          detail: `${recoveryTypeLabel(records[0].type)} · ${records[0].summary}`,
          record: records[0],
          actionLabel: "打开建议任务",
        }
      : null;
  const handleRecommendationAction = () => {
    if (!recommendation) return;
    if (recommendation.kind === "active-video") {
      onOpenVideoTask?.();
      setOpen(false);
      return;
    }
    onSelect(recommendation.record);
    setOpen(false);
  };
  const clearFilteredRecords = () => {
    filteredRecords.forEach((record) => onDismiss(record.id));
  };

  return (
    <div className="recovery-center">
      <button
        type="button"
        className={triggerClassName}
        aria-label={`创作中心，${activeCount} 个进行中，${records.length} 个可恢复`}
        aria-expanded={open}
        onClick={toggleOpen}
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
              <p>继续最近工作、处理失败任务并查看恢复结果。</p>
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
            {totalCount > 0 && riskFocus && (
              <section className="recovery-risk-summary" aria-label="恢复风险摘要">
                <article>
                  <span>待处理总数</span>
                  <strong>{totalCount}</strong>
                  <p>{totalCount > 1 ? "建议按优先级逐项处理。" : "当前只有 1 项需要关注。"}</p>
                </article>
                <article className="recovery-risk-focus">
                  <span>保存较久</span>
                  <strong>{staleRecoveryCount}</strong>
                  <p>{staleRecoveryCount > 0 ? "超过 24 小时未处理，建议恢复或清理。" : "暂无长期搁置记录。"}</p>
                  {staleRecoveryCount > 0 && (
                    <button type="button" className="ghost-button" aria-label="从风险摘要查看保存较久的恢复项" onClick={openStaleRecoveries}>
                      <Clock size={13} /> 查看较久记录
                    </button>
                  )}
                </article>
                <article className="recovery-risk-focus">
                  <span>集中工作区</span>
                  <strong>{riskFocus.label} {riskFocus.count}</strong>
                  <p>优先查看这一类待处理。</p>
                  <button type="button" className="ghost-button" aria-label={`只看${riskFocus.label}恢复风险`} onClick={openRiskFocus}>
                    <AlertTriangle size={13} /> 查看风险
                  </button>
                </article>
              </section>
            )}
            {recommendation && (
              <section className="recovery-recommendation" aria-label="建议先处理">
                <div>
                  <span>建议先处理</span>
                  <strong>{recommendation.title}</strong>
                  <p>{recommendation.detail}</p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  aria-label={recommendation.actionLabel}
                  onClick={handleRecommendationAction}
                >
                  {recommendation.actionLabel}
                </button>
              </section>
            )}
            <div className="recovery-tabs" role="tablist" aria-label="创作中心分区">
              <button
                type="button"
                role="tab"
                id="recovery-continue-tab"
                aria-controls="recovery-continue-panel"
                aria-selected={section === "continue"}
                aria-label="继续创作"
                onClick={() => setSection("continue")}
              >
                <RotateCcw size={14} />
                <span>继续</span>
              </button>
              <button
                type="button"
                role="tab"
                id="recovery-tasks-tab"
                aria-controls="recovery-tasks-panel"
                aria-selected={section === "tasks"}
                aria-label={`待处理 ${totalCount}`}
                onClick={() => setSection("tasks")}
              >
                <Clock size={14} />
                <span>待处理</span>
                <strong>{totalCount}</strong>
              </button>
              <button
                type="button"
                role="tab"
                id="recovery-activity-tab"
                aria-controls="recovery-activity-panel"
                aria-selected={section === "activity"}
                aria-label={`近期活动 ${activities.length}`}
                onClick={() => setSection("activity")}
              >
                <History size={14} />
                <span>活动</span>
                <strong>{activities.length}</strong>
              </button>
            </div>
            {section === "continue" && (
              <div
                className="recovery-tab-panel"
                role="tabpanel"
                id="recovery-continue-panel"
                aria-label="继续创作"
              >
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
              </div>
            )}
            {section === "tasks" && (
              <div
                className="recovery-tab-panel"
                role="tabpanel"
                id="recovery-tasks-panel"
                aria-label="待处理"
              >
                {hasPanelContent && (
                  <div className="recovery-task-filters" role="group" aria-label="待处理类型筛选">
                    {taskFilterOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className="recovery-filter-chip"
                        aria-label={option.ariaLabel}
                        aria-pressed={taskFilter === option.key}
                        onClick={() => selectTaskFilter(option.key)}
                      >
                        <span>{option.label}</span>
                        <strong>{option.count}</strong>
                      </button>
                    ))}
                  </div>
                )}
                {hasPanelContent && (
                  <p className="recovery-filter-summary" role="status" aria-label="待处理筛选摘要">
                    {taskFilter === "all" ? "当前显示：全部" : `当前只看：${activeTaskFilter.label}`} · {activeTaskFilter.count} 项待处理
                  </p>
                )}
                {hasPanelContent && (
                  <section className="recovery-flow-guide" aria-label="待处理流程提示">
                    <article>
                      <span>先看优先级</span>
                      <strong>{staleRecoveryCount > 0 ? `${staleRecoveryCount} 项保存较久` : "暂无长期搁置"}</strong>
                    </article>
                    <article>
                      <span>当前队列</span>
                      <strong>{activeTaskFilter.label}</strong>
                    </article>
                    <article>
                      <span>下一步</span>
                      <strong>{activeTaskFilter.count > 0 ? "恢复或忽略" : "切换筛选"}</strong>
                    </article>
                  </section>
                )}
                {cleanupNotice && (
                  <p className="recovery-cleanup-notice" role="status" aria-label="恢复清理结果">
                    <CheckCircle2 size={14} /> {cleanupNotice}
                  </p>
                )}
                {showQueuePriorityPrompt && (
                  <section className="recovery-queue-priority" aria-label="当前队列优先提示">
                    <div>
                      <strong>{activeTaskFilter.label}队列含 {activeWorkspaceStaleCount} 项保存较久</strong>
                      <span>已排在当前队列前面，建议先恢复或清理。</span>
                    </div>
                    <button type="button" className="ghost-button" aria-label="查看全部保存较久恢复项" onClick={openStaleRecoveries}>
                      <Clock size={13} /> 查看较久记录
                    </button>
                  </section>
                )}
                {taskFilter === "stale" && oldestStaleRecord && (
                  <section className="recovery-stale-priority" aria-label="保存较久优先处理">
                    <div>
                      <strong>最旧记录优先</strong>
                      <span>{oldestStaleRecord.label} · {formatRecoveryTime(oldestStaleRecord.createdAt)}</span>
                      <small>共 {staleRecoveryCount} 项，按最旧优先处理</small>
                    </div>
                    <div className="recovery-stale-priority-actions">
                      <button type="button" className="ghost-button" aria-label="打开最旧保存的恢复项" onClick={openOldestStaleRecovery}>
                        打开最旧记录
                      </button>
                      <button type="button" className="ghost-button" aria-label="忽略最旧保存的恢复项" onClick={dismissOldestStaleRecovery}>
                        忽略最旧记录
                      </button>
                      <button type="button" className="ghost-button danger" aria-label="忽略全部保存较久恢复项" onClick={dismissAllStaleRecoveries}>
                        忽略全部较久
                      </button>
                    </div>
                  </section>
                )}
                {!hasPanelContent && <p className="recovery-empty">当前没有待处理任务。</p>}
                {hasPanelContent && !hasFilteredTasks && (
                  <div className="recovery-empty-action">
                    <p className="recovery-empty">当前筛选没有待处理任务。</p>
                    <button
                      type="button"
                      className="ghost-button"
                      aria-label="显示全部待处理记录"
                      onClick={() => setTaskFilter("all")}
                    >
                      显示全部待处理
                    </button>
                  </div>
                )}
              {showActiveVideoTask && activeVideoTask && (
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
              {filteredRecords.length > 0 && (
                <>
                  <div className="recovery-list" role="list">
                    {filteredRecords.map((record) => {
                      const recordIsStale = isStaleRecovery(record.createdAt);
                      const recordTypeLabel = recoveryTypeLabel(record.type);
                      const recordAriaLabel = `${recordIsStale ? "保存较久的恢复项" : "恢复项"}：${record.label}，${recordTypeLabel}，${record.summary}`;
                      return (
                        <article
                          key={record.id}
                          className={`recovery-item${recordIsStale ? " recovery-item-stale" : ""}`}
                          role="listitem"
                          aria-label={recordAriaLabel}
                        >
                          <div>
                            <div className="recovery-item-meta">
                              <span className="recovery-kind">{recordTypeLabel}</span>
                              {recordIsStale && (
                                <span className="recovery-stale-badge">
                                  <Clock size={12} /> 保存较久
                                </span>
                              )}
                            </div>
                            <h4>{record.label}</h4>
                            <p>{record.summary}</p>
                            {recordIsStale && <p className="recovery-stale-hint">超过 24 小时未处理，建议优先恢复或忽略。</p>}
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
                      );
                    })}
                  </div>
                  {taskFilter === "all" ? (
                    <button type="button" className="ghost-button danger recovery-clear" aria-label="清空恢复记录" onClick={onClear}>
                    <Trash2 size={14} /> 清空恢复记录
                  </button>
                  ) : (
                    <button
                      type="button"
                      className="ghost-button danger recovery-clear"
                      aria-label={`清空${activeTaskFilter.label}恢复记录`}
                      onClick={clearFilteredRecords}
                    >
                      <Trash2 size={14} /> 清空{activeTaskFilter.label}恢复记录
                    </button>
                  )}
                </>
              )}
              {showRecentVideoTasks && (
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
              </div>
            )}
            {section === "activity" && (
              <div
                className="recovery-tab-panel"
                role="tabpanel"
                id="recovery-activity-panel"
                aria-label="近期活动"
              >
                {activities.length > 0 ? (
                  <section className="recovery-activity" aria-label="近期创作活动">
                    <div className="recovery-activity-heading">
                      <h4><History size={14} /> 近期活动</h4>
                      {onClearActivity && (
                        <button type="button" className="ghost-button" aria-label="清空创作活动" onClick={onClearActivity}>
                          清空
                        </button>
                      )}
                    </div>
                    <p className="recovery-activity-summary" role="status" aria-label="创作活动摘要">
                      最近 {recentActivities.length} 条创作活动 · 最新：{recentActivities[0].label}
                    </p>
                    <p className="recovery-activity-outcomes" role="status" aria-label="创作活动结果摘要">
                      <span>已完成 {activityOutcomeCounts.completed}</span>
                      <span>已恢复 {activityOutcomeCounts.restored}</span>
                      <span>已忽略 {activityOutcomeCounts.ignored}</span>
                    </p>
                    <div className="recovery-activity-list">
                      {recentActivities.slice(0, 5).map((activity) => {
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
                ) : (
                  <p className="recovery-empty">完成、恢复或忽略任务后，活动会显示在这里。</p>
                )}
              </div>
            )}
          </>
        </section>
      )}
    </div>
  );
}
