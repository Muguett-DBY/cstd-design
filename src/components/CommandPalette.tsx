import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  group: "navigation" | "action" | "conversation";
  keywords?: string[];
  shortcut?: string;
  perform: () => void;
};

function fuzzyMatch(query: string, target: string): { score: number; matched: boolean } {
  if (!query) return { score: 0, matched: true };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) {
    const idx = t.indexOf(q);
    return { score: 100 - idx, matched: true };
  }
  let qIdx = 0;
  let score = 0;
  let prevMatch = -2;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += prevMatch === i - 1 ? 10 : 1;
      prevMatch = i;
      qIdx++;
    }
  }
  if (qIdx === q.length) return { score, matched: true };
  return { score: 0, matched: false };
}

function scoreItem(query: string, item: CommandItem): number {
  if (!query) return 1;
  const labelMatch = fuzzyMatch(query, item.label);
  const descriptionMatch = fuzzyMatch(query, item.description ?? "");
  const keywordScore = item.keywords?.reduce((best, keyword) => {
    const match = fuzzyMatch(query, keyword);
    return match.matched ? Math.max(best, match.score) : best;
  }, 0) ?? 0;

  return Math.max(
    labelMatch.matched ? labelMatch.score * 3 : 0,
    descriptionMatch.matched ? descriptionMatch.score * 2 : 0,
    keywordScore,
  );
}

export function CommandPalette({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const normalizedQuery = query.trim();
    const scored = items
      .map((item) => ({ item, score: scoreItem(normalizedQuery, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((x) => x.item);
  }, [query, items]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filtered]);
  const safeActiveIndex = filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  const groupOrder: CommandItem["group"][] = ["navigation", "conversation", "action"];
  const resultCountLabel = `共 ${filtered.length} 个命令`;
  const activePositionLabel = filtered.length > 0 ? `当前 ${safeActiveIndex + 1}/${filtered.length}` : "当前 0/0";

  useEffect(() => {
    if (open && inputRef.current) {
      setActiveIndex(0);
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const activeOption = listRef.current?.querySelector<HTMLElement>(`[data-command-index="${safeActiveIndex}"]`);
    activeOption?.scrollIntoView?.({ block: "nearest" });
  }, [safeActiveIndex, filtered]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex(filtered.length === 0 ? 0 : Math.min(safeActiveIndex + 1, filtered.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(Math.max(safeActiveIndex - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = filtered[safeActiveIndex];
        if (item) {
          item.perform();
          onClose();
        }
        return;
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, filtered, safeActiveIndex, onClose]);

  if (!open) return null;

  let runningIndex = 0;

  return (
    <div className="command-palette-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="命令面板">
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-search">
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="搜索操作、对话、页面..."
            aria-label="命令搜索"
            className="command-palette-input"
          />
          <span className="command-palette-esc">Esc</span>
        </div>
        <div className="command-palette-summary" aria-live="polite">
          <span className="command-palette-summary-count">{resultCountLabel}</span>
          <span className="command-palette-summary-position">{activePositionLabel}</span>
        </div>
        <div className="command-palette-list" ref={listRef} role="listbox">
          {filtered.length === 0 ? (
            <div className="command-palette-empty">
              <Search size={32} />
              <span>没有匹配的命令</span>
            </div>
          ) : (
            groupOrder.map((groupKey) => {
              const group = grouped[groupKey];
              if (!group || group.length === 0) return null;
              return (
                <div key={groupKey} className="command-palette-group">
                  <div className="command-palette-group-label">
                    {groupKey === "navigation" ? "导航" : groupKey === "conversation" ? "对话" : "操作"}
                  </div>
                  {group.map((item) => {
                    const isActive = runningIndex === safeActiveIndex;
                    const idx = runningIndex;
                    runningIndex++;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-command-index={idx}
                        className={`command-palette-item${isActive ? " active" : ""}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => { item.perform(); onClose(); }}
                      >
                        <span className="command-palette-item-icon"><Icon size={16} /></span>
                        <span className="command-palette-item-text">
                          <span className="command-palette-item-label">{item.label}</span>
                          {item.description && <span className="command-palette-item-desc">{item.description}</span>}
                        </span>
                        {item.shortcut && <kbd className="command-palette-shortcut">{item.shortcut}</kbd>}
                        <ArrowRight size={14} className="command-palette-item-arrow" />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        <div className="command-palette-footer">
          <span><kbd>↑↓</kbd> 导航</span>
          <span><kbd>↵</kbd> 执行</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    </div>
  );
}
