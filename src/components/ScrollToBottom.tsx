import { ChevronDown } from "lucide-react";

export function ScrollToBottom({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <div className="scroll-to-bottom">
      <button type="button" onClick={onClick} aria-label="滚动到最新消息">
        <ChevronDown size={20} />
      </button>
    </div>
  );
}
