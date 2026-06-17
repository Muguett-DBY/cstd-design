export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <img src="/brand/mascot.png" alt="" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
