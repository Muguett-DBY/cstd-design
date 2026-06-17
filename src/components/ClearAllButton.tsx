import { useRef, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";

export function ClearAllButton({ label, onClear }: { label: string; onClear: () => Promise<void> }) {
  const [clearing, setClearing] = useState(false);
  const activeRef = useRef(false);

  return (
    <button
      type="button"
      className="ghost-button danger clear-all-button"
      disabled={clearing}
      onClick={async () => {
        if (activeRef.current) return;
        activeRef.current = true;
        const timer = setTimeout(() => setClearing(true), 150);
        try {
          await onClear();
        } finally {
          clearTimeout(timer);
          activeRef.current = false;
          setClearing(false);
        }
      }}
    >
      {clearing ? <RefreshCw size={16} className="spin" /> : <Trash2 size={16} />} {clearing ? "清空中..." : label}
    </button>
  );
}
