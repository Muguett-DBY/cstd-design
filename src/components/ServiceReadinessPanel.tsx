import { AlertTriangle, CheckCircle2, Copy, RefreshCw, ShieldCheck, WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type ServiceReadinessCheck, type ServiceReadinessSnapshot } from "../api";
import { formatServiceReadinessDiagnostics } from "../utils/serviceReadinessDiagnostics";

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const READINESS_ACTION_COPY: Record<ServiceReadinessCheck["id"], { title: string; reason: string; priority: number }> = {
  security: {
    title: "处理安全配置",
    reason: "避免登录、会话或素材签名流程不稳定。",
    priority: 1,
  },
  database: {
    title: "处理数据服务",
    reason: "避免会话、素材记录和恢复状态无法读取或保存。",
    priority: 2,
  },
  generation: {
    title: "处理生成服务",
    reason: "避免咨询、图片和视频创作全部失败。",
    priority: 3,
  },
  media: {
    title: "处理素材存储",
    reason: "避免上传和生成结果无法保存。",
    priority: 4,
  },
};

function readinessActions(checks: ServiceReadinessCheck[]) {
  return checks
    .filter((check) => check.status === "attention")
    .map((check) => ({ ...check, action: READINESS_ACTION_COPY[check.id] }))
    .sort((a, b) => a.action.priority - b.action.priority);
}

type WorkspaceAvailability = "ready" | "limited" | "blocked";

function workspaceAvailability(checks: ServiceReadinessCheck[]) {
  const attention = new Set(checks.filter((check) => check.status === "attention").map((check) => check.id));
  const foundationBlocked = attention.has("security") || attention.has("database");
  const generationBlocked = foundationBlocked || attention.has("generation");
  const assetStatus: WorkspaceAvailability = foundationBlocked
    ? "blocked"
    : attention.has("media") ? "limited" : "ready";

  return [
    { label: "咨询创作", status: generationBlocked ? "blocked" as const : "ready" as const },
    {
      label: "图片与视频",
      status: generationBlocked ? "blocked" as const : attention.has("media") ? "limited" as const : "ready" as const,
    },
    { label: "素材库", status: assetStatus },
  ];
}

const AVAILABILITY_LABEL: Record<WorkspaceAvailability, string> = {
  ready: "可用",
  limited: "受限",
  blocked: "不可用",
};

export function ServiceReadinessPanel() {
  const [snapshot, setSnapshot] = useState<ServiceReadinessSnapshot | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void api.readiness()
      .then((next) => {
        if (active) setSnapshot(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "服务状态检查失败。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setLoading(true);
    setError("");
    setCopyStatus("");
    setRefreshKey((current) => current + 1);
  };

  const copyDiagnostics = async () => {
    if (!snapshot) return;
    if (!navigator.clipboard?.writeText) {
      setCopyStatus("复制失败，请检查浏览器剪贴板权限。");
      return;
    }
    try {
      await navigator.clipboard.writeText(formatServiceReadinessDiagnostics(snapshot));
      setCopyStatus("诊断摘要已复制。");
    } catch {
      setCopyStatus("复制失败，请检查浏览器剪贴板权限。");
    }
  };
  const actions = snapshot ? readinessActions(snapshot.checks) : [];
  const workspaces = snapshot ? workspaceAvailability(snapshot.checks) : [];
  const readyCount = snapshot?.checks.filter((check) => check.status === "ready").length ?? 0;
  const totalCount = snapshot?.checks.length ?? 0;
  const readyPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  return (
    <section className="settings-section service-readiness-section" aria-labelledby="service-readiness-title">
      <div className="service-readiness-heading">
        <div>
          <h4 id="service-readiness-title"><ShieldCheck size={14} /> 服务就绪中心</h4>
          <p className="settings-hint">在开始创作前检查数据、素材、安全与生成配置，不会读取或显示密钥。</p>
        </div>
        <button
          type="button"
          className="icon-button service-readiness-refresh"
          onClick={refresh}
          aria-label="重新检查服务状态"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "is-spinning" : ""} />
        </button>
      </div>

      {loading && !snapshot && (
        <div className="service-readiness-loading" role="status" aria-live="polite">
          <span className="service-readiness-pulse" />
          正在检查创作环境…
        </div>
      )}

      {error && (
        <div className="service-readiness-error" role="alert">
          <AlertTriangle size={16} />
          <div><strong>暂时无法检查</strong><span>{error}</span></div>
        </div>
      )}

      {snapshot && (
        <div className={`service-readiness-summary is-${snapshot.status}`} role="status" aria-live="polite">
          <div className="service-readiness-summary-copy">
            {snapshot.status === "ready" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div>
              <strong>{snapshot.status === "ready" ? "创作环境已就绪" : "创作环境需要处理"}</strong>
              <span>检查于 {formatCheckedAt(snapshot.checkedAt)}{loading ? " · 正在刷新" : ""}</span>
            </div>
          </div>
          <div className="service-readiness-overview">
            <div className="service-readiness-overview-copy">
              <strong>{readyCount} / {totalCount} 项已就绪</strong>
              <span>{totalCount - readyCount} 项待处理</span>
            </div>
            <div
              className="service-readiness-progress"
              role="progressbar"
              aria-label="服务就绪进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readyPercent}
            >
              <span style={{ width: `${readyPercent}%` }} />
            </div>
          </div>
          <div className="service-readiness-actions">
            <button type="button" className="ghost-button service-readiness-copy" onClick={copyDiagnostics}>
              <Copy size={14} />
              复制诊断摘要
            </button>
            {copyStatus && (
              <span className="service-readiness-copy-status" aria-live="polite">{copyStatus}</span>
            )}
          </div>
          <div className="service-readiness-impact">
            <div>
              <strong>工作区可用性</strong>
              <span>根据当前检查结果预估，不影响已保存在本地的内容。</span>
            </div>
            <ul aria-label="工作区可用性">
              {workspaces.map((workspace) => (
                <li key={workspace.label} className={`is-${workspace.status}`}>
                  <span className="service-readiness-impact-dot" aria-hidden="true" />
                  <strong>{workspace.label}</strong>
                  <span>{AVAILABILITY_LABEL[workspace.status]}</span>
                </li>
              ))}
            </ul>
          </div>
          {actions.length > 0 && (
            <div className="service-readiness-action-plan" aria-labelledby="service-readiness-action-title">
              <div className="service-readiness-action-heading">
                <WandSparkles size={15} />
                <strong id="service-readiness-action-title">建议处理顺序</strong>
                <span>先解决会阻断创作入口的问题，再处理保存链路。</span>
              </div>
              <ol aria-label="服务就绪建议处理顺序">
                {actions.map((check, index) => (
                  <li key={check.id}>
                    <span className="service-readiness-step">{index === 0 ? "先" : "再"}</span>
                    <div>
                      <strong>{index === 0 ? `先${check.action.title}` : `再${check.action.title}`}</strong>
                      <span>{check.action.reason}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <ul className="service-readiness-checks">
            {snapshot.checks.map((check) => (
              <li key={check.id} className={`is-${check.status}`}>
                {check.status === "ready" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <div><strong>{check.label}</strong><span>{check.detail}</span></div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
