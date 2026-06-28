import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type ServiceReadinessSnapshot } from "../api";

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

export function ServiceReadinessPanel() {
  const [snapshot, setSnapshot] = useState<ServiceReadinessSnapshot | null>(null);
  const [error, setError] = useState("");
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
    setRefreshKey((current) => current + 1);
  };

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
