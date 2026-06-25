import { AlertTriangle, CheckCircle2, LoaderCircle, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

type Action = { label: string; onClick: () => void; icon?: ReactNode };

export function CreationStatus({
  status,
  title,
  detail,
  primaryAction,
  secondaryAction,
}: {
  status: "pending" | "success" | "error" | "offline";
  title: string;
  detail?: string;
  primaryAction?: Action;
  secondaryAction?: Action;
}) {
  const Icon = status === "pending" ? LoaderCircle : status === "success" ? CheckCircle2 : status === "offline" ? WifiOff : AlertTriangle;
  const role = status === "error" ? "alert" : "status";
  return (
    <div className={`creation-status creation-status-${status}`} role={role} aria-live={status === "error" ? "assertive" : "polite"}>
      <Icon size={18} className={status === "pending" ? "spin" : undefined} />
      <div className="creation-status-copy">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="creation-status-actions">
          {secondaryAction && <button type="button" className="ghost-button" onClick={secondaryAction.onClick}>{secondaryAction.icon}{secondaryAction.label}</button>}
          {primaryAction && <button type="button" className="primary-button" onClick={primaryAction.onClick}>{primaryAction.icon}{primaryAction.label}</button>}
        </div>
      )}
    </div>
  );
}
