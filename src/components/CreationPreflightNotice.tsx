import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import type { ServiceReadinessSnapshot } from "../api";

type WorkspaceKind = "chat" | "image" | "video";

const WORKSPACE_LABELS: Record<WorkspaceKind, string> = {
  chat: "咨询",
  image: "图片",
  video: "视频",
};

export function CreationPreflightNotice({
  workspace,
  snapshot,
  loading,
  error,
  onRefresh,
}: {
  workspace: WorkspaceKind;
  snapshot: ServiceReadinessSnapshot | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const workspaceLabel = WORKSPACE_LABELS[workspace];
  const refreshLabel = `重新检查${workspaceLabel}创作预检`;
  const attentionChecks = snapshot?.checks.filter((check) => check.status === "attention") ?? [];

  if (!loading && !error && attentionChecks.length === 0) return null;

  if (error && attentionChecks.length === 0) {
    return (
      <div className="creation-preflight is-error" role="alert" aria-label={`${workspaceLabel}创作预检失败`}>
        <AlertTriangle size={17} />
        <div>
          <div className="creation-preflight-title">
            <strong>{workspaceLabel}创作预检暂不可用</strong>
            <span className="creation-preflight-badge is-error">待确认</span>
          </div>
          <span>{error}。可继续尝试，或重新检查后再开始。</span>
        </div>
        <button type="button" className="ghost-button" onClick={onRefresh} disabled={loading} aria-label={refreshLabel}>
          <RefreshCw size={14} className={loading ? "is-spinning" : ""} /> {refreshLabel}
        </button>
      </div>
    );
  }

  if (loading && !snapshot) {
    return (
      <div className="creation-preflight" role="status" aria-label={`${workspaceLabel}创作预检提醒`}>
        <RefreshCw size={17} className="is-spinning" />
        <div>
          <div className="creation-preflight-title">
            <strong>正在检查{workspaceLabel}创作环境</strong>
            <span className="creation-preflight-badge">检查中</span>
          </div>
          <span>会检查数据、素材、安全与生成配置，不会读取或显示密钥。</span>
        </div>
      </div>
    );
  }

  if (attentionChecks.length === 0) return null;

  return (
    <div className="creation-preflight is-attention" role="status" aria-label={`${workspaceLabel}创作预检提醒`} aria-live="polite">
      <ShieldAlert size={17} />
      <div>
        <div className="creation-preflight-title">
          <strong>{workspaceLabel}创作预检需要处理 {attentionChecks.length} 项</strong>
          <span className="creation-preflight-badge">需处理 {attentionChecks.length} 项</span>
        </div>
        <span>{workspaceLabel}创作仍可继续尝试，但以下项目可能影响生成、保存或恢复。</span>
        <ul aria-label="需要处理的服务项目">
          {attentionChecks.map((check) => (
            <li key={check.id}><b>{check.label}</b><span>{check.detail}</span></li>
          ))}
        </ul>
        <span>可在设置里的“服务就绪中心”查看完整状态。</span>
      </div>
      <button type="button" className="ghost-button" onClick={onRefresh} disabled={loading} aria-label={refreshLabel}>
        <RefreshCw size={14} className={loading ? "is-spinning" : ""} /> {refreshLabel}
      </button>
    </div>
  );
}
