import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown, ChevronUp, Clock, Filter, MessageSquare, Search, Star, Trash2, X } from "lucide-react";
import type { DateFilter, RoleFilter } from "../hooks/useMessageSearch";
import type { SavedSearch } from "../hooks/useSavedSearches";

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
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
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
  roleFilter = "all",
  dateFilter = "all",
  onRoleFilterChange,
  onDateFilterChange,
  onSaveSearch,
  savedSearches = [],
  onApplySavedSearch,
  onDeleteSavedSearch,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  totalResults: number;
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  threadResults?: number;
  roleFilter?: RoleFilter;
  dateFilter?: DateFilter;
  onRoleFilterChange?: (r: RoleFilter) => void;
  onDateFilterChange?: (d: DateFilter) => void;
  onSaveSearch?: () => void;
  savedSearches?: SavedSearch[];
  onApplySavedSearch?: (s: SavedSearch) => void;
  onDeleteSavedSearch?: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<string[]>(loadSearchHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

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

  const hasActiveFilters = roleFilter !== "all" || dateFilter !== "all";

  return (
    <div className="message-search-bar">
      <Search size={16} className="search-icon" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => {
          if (history.length > 0) setShowHistory(true);
          if (savedSearches.length > 0) setShowSaved(true);
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowHistory(false);
            setShowSaved(false);
          }, 200);
        }}
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
      {showSaved && savedSearches.length > 0 && !query && (
        <div className="search-history-dropdown">
          {savedSearches.map((s) => (
            <div key={s.id} className="search-saved-item">
              <button
                type="button"
                className="search-history-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onApplySavedSearch?.(s);
                  setShowSaved(false);
                }}
              >
                <Star size={12} />
                {s.name}
                <span className="search-saved-meta">
                  {s.roleFilter !== "all" ? `· ${s.roleFilter}` : ""}
                  {s.dateFilter !== "all" ? `· ${s.dateFilter}` : ""}
                </span>
              </button>
              {onDeleteSavedSearch && (
                <button
                  type="button"
                  className="search-saved-delete"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onDeleteSavedSearch(s.id);
                  }}
                  aria-label={`删除已保存的搜索 ${s.name}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="search-filter-wrapper">
        <button
          type="button"
          className={`search-filter-btn${hasActiveFilters ? " active" : ""}`}
          onClick={() => setShowFilters((s) => !s)}
          title="筛选"
          aria-label="筛选"
        >
          <Filter size={14} />
        </button>
        {showFilters && (
          <div className="search-filters-dropdown" onMouseLeave={() => setShowFilters(false)}>
            <div className="search-filter-group">
              <span className="search-filter-label">发送方</span>
              <div className="search-filter-options">
                {(["all", "user", "assistant"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`search-filter-pill${roleFilter === r ? " active" : ""}`}
                    onClick={() => onRoleFilterChange?.(r)}
                  >
                    {r === "all" ? "全部" : r === "user" ? "用户" : "助手"}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-filter-group">
              <span className="search-filter-label">时间</span>
              <div className="search-filter-options">
                {(["all", "today", "week", "month"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`search-filter-pill${dateFilter === d ? " active" : ""}`}
                    onClick={() => onDateFilterChange?.(d)}
                  >
                    {d === "all" ? "全部" : d === "today" ? "今天" : d === "week" ? "近 7 天" : "近 30 天"}
                  </button>
                ))}
              </div>
            </div>
            {onSaveSearch && (
              <button
                type="button"
                className="search-save-btn"
                onClick={() => {
                  onSaveSearch();
                  setShowFilters(false);
                }}
                disabled={!query.trim()}
              >
                <Bookmark size={12} /> 保存当前搜索
              </button>
            )}
          </div>
        )}
      </div>
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
