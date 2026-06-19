import type { ReactNode } from "react";
import { MessageSquare } from "lucide-react";

export function EmptyState({ title, text, children, icon }: { title: string; text: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon || <img src="/brand/mascot.png" alt="" />}
      <strong>{title}</strong>
      <span>{text}</span>
      {children}
    </div>
  );
}

export function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-loader">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-avatar" />
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatEmptyState() {
  return (
    <EmptyState
      title="可以开始问了"
      text="这里只保留你的私人会话，不显示内部服务信息。"
      icon={<MessageSquare size={48} strokeWidth={1.5} className="empty-state-icon" />}
    />
  );
}
