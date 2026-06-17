import type { ReactNode } from "react";

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <img src="/brand/mascot.png" alt="" />
      <strong>{title}</strong>
      <span>{text}</span>
      {children}
    </div>
  );
}
