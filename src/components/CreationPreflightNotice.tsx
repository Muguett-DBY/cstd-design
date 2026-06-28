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
  const attentionChecks = snapshot?.checks.filter((check) => check.status === "attention") ?? [];

  if (!loading && !error && attentionChecks.length === 0) return null;

  if (error && attentionChecks.length === 0) {
    return (
      <div className="creation-preflight is-error" role="alert" aria-label="创作预检失败">
        <AlertTriangle size={17} />
        <div>
          <strong>暂时无法完成创作预检</strong>
          <span>{error}。可继续尝试，或重新检查创作预检后再开始。</span>
        </div>
        <button type="button" className="ghost-button" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? "is-spinning" : ""} /> 重新检查创作预检
        </button>
      </div>
    );
  }

  if (loading && !snapshot) {
    return (
      <div className="creation-preflight" role="status" aria-label="创作预检提醒">
        <RefreshCw size={17} className="is-spinning" />
        <div>
          <strong>正在检查创作环境</strong>
          <span>会检查数据、素材、安全与生成配置，不会读取或显示密钥。</span>
        </div>
      </div>
    );
  }

  if (attentionChecks.length === 0) return null;

  return (
    <div className="creation-preflight is-attention" role="status" aria-label="创作预检提醒" aria-live="polite">
      <ShieldAlert size={17} />
      <div>
        <strong>创作前建议先处理 {attentionChecks.length} 项服务配置</strong>
        <span>{WORKSPACE_LABELS[workspace]}创作仍可继续尝试，但以下项目可能影响生成、保存或恢复。</span>
        <ul>
          {attentionChecks.map((check) => (
            <li key={check.id}><b>{check.label}</b><span>{check.detail}</span></li>
          ))}
        </ul>
        <span>可在设置里的“服务就绪中心”查看完整状态。</span>
      </div>
      <button type="button" className="ghost-button" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={14} className={loading ? "is-spinning" : ""} /> 重新检查创作预检
      </button>
    </div>
  );
}
