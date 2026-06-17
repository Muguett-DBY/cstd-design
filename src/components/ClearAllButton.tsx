import { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";

export function ClearAllButton({ label, onClear }: { label: string; onClear: () => Promise<void> }) {
  const [clearing, setClearing] = useState(false);
  return (
    <button
      type="button"
      className="ghost-button danger clear-all-button"
      disabled={clearing}
      onClick={async () => {
        setClearing(true);
        try {
          await onClear();
        } finally {
          setClearing(false);
        }
      }}
    >
      {clearing ? <RefreshCw size={16} className="spin" /> : <Trash2 size={16} />} {clearing ? "清空中..." : label}
    </button>
  );
}
