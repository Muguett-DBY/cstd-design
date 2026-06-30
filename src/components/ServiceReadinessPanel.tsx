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
          <div className="service-readiness-actions">
            <button type="button" className="ghost-button service-readiness-copy" onClick={copyDiagnostics}>
              <Copy size={14} />
              复制诊断摘要
            </button>
            {copyStatus && (
              <span className="service-readiness-copy-status" aria-live="polite">{copyStatus}</span>
            )}
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
