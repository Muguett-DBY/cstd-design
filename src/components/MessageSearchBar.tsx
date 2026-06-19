import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clock, MessageSquare, Search, X } from "lucide-react";

const SEARCH_HISTORY_KEY = "cstd-design:searchHistory";
const MAX_HISTORY = 5;

function loadSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: string[]) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

export function MessageSearchBar({
  query,
  onQueryChange,
  totalResults,
  activeIndex,
  onNext,
  onPrev,
  onClose,
  threadResults = 0,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  totalResults: number;
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  threadResults?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<string[]>(loadSearchHistory);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addToHistory = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...history.filter((h) => h !== q)].slice(0, MAX_HISTORY);
    setHistory(updated);
    saveSearchHistory(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addToHistory(query);
      if (e.shiftKey) onPrev();
      else onNext();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="message-search-bar">
      <Search size={16} className="search-icon" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => { if (history.length > 0) setShowHistory(true); }}
        onBlur={() => { setTimeout(() => setShowHistory(false), 200); }}
        placeholder="搜索消息内容..."
        className="message-search-input"
        onKeyDown={handleKeyDown}
      />
      {showHistory && history.length > 0 && !query && (
        <div className="search-history-dropdown">
          {history.map((h, i) => (
            <button
              key={i}
              type="button"
              className="search-history-item"
              onMouseDown={(e) => {
                e.preventDefault();
                onQueryChange(h);
                setShowHistory(false);
              }}
            >
              <Clock size={12} />
              {h}
            </button>
          ))}
        </div>
      )}
      {totalResults > 0 && (
        <span className="search-result-count">
          {activeIndex + 1}/{totalResults}
          {threadResults > 0 && (
            <span className="search-thread-indicator" title={`包含 ${threadResults} 个线程回复结果`}>
              <MessageSquare size={10} /> {threadResults}
            </span>
          )}
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
