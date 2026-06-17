import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

export function MessageSearchBar({
  query,
  onQueryChange,
  totalResults,
  activeIndex,
  onNext,
  onPrev,
  onClose,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  totalResults: number;
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="message-search-bar">
      <Search size={16} className="search-icon" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="搜索消息内容..."
        className="message-search-input"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) onPrev();
            else onNext();
          }
          if (e.key === "Escape") onClose();
        }}
      />
      {totalResults > 0 && (
        <span className="search-result-count">
          {activeIndex + 1}/{totalResults}
        </span>
      )}
      {query && totalResults === 0 && (
        <span className="search-result-count no-result">无结果</span>
      )}
      <button type="button" className="search-nav-btn" onClick={onPrev} disabled={totalResults === 0} title="上一个 (Shift+Enter)">
        <ChevronUp size={14} />
      </button>
      <button type="button" className="search-nav-btn" onClick={onNext} disabled={totalResults === 0} title="下一个 (Enter)">
        <ChevronDown size={14} />
      </button>
      <button type="button" className="search-close-btn" onClick={onClose} title="关闭 (Esc)">
        <X size={14} />
      </button>
    </div>
  );
}
