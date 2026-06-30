import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { COMMAND_PALETTE_RECENT_STORAGE_KEY } from "../storage-keys";

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

const MAX_RECENT_COMMANDS = 5;
const GROUP_ORDER: CommandItem["group"][] = ["navigation", "conversation", "action"];
const GROUP_LABELS: Record<CommandItem["group"], string> = {
  navigation: "导航",
  conversation: "对话",
  action: "操作",
};

type CommandSection = {
  key: string;
  label: string;
  items: CommandItem[];
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

function readRecentCommandIds(): string[] {
  try {
    const stored = globalThis.localStorage?.getItem(COMMAND_PALETTE_RECENT_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_RECENT_COMMANDS) : [];
  } catch {
    return [];
  }
}

function persistRecentCommandIds(ids: string[]) {
  try {
    globalThis.localStorage?.setItem(COMMAND_PALETTE_RECENT_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors: command execution should never fail because history persistence is unavailable.
  }
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
  const [recentCommandIds, setRecentCommandIds] = useState(readRecentCommandIds);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = query.trim();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return items;
    const scored = items
      .map((item) => ({ item, score: scoreItem(normalizedQuery, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((x) => x.item);
  }, [normalizedQuery, items]);

  const recentItems = useMemo(() => {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    return recentCommandIds
      .map((id) => itemsById.get(id))
      .filter((item): item is CommandItem => Boolean(item));
  }, [items, recentCommandIds]);

  const regularItems = useMemo(() => {
    if (normalizedQuery || recentItems.length === 0) return filtered;
    const recentIds = new Set(recentItems.map((item) => item.id));
    return filtered.filter((item) => !recentIds.has(item.id));
  }, [filtered, normalizedQuery, recentItems]);

  const visibleItems = useMemo(() => {
    if (normalizedQuery || recentItems.length === 0) return filtered;
    return [...recentItems, ...regularItems];
  }, [filtered, normalizedQuery, recentItems, regularItems]);

  const commandSections = useMemo(() => {
    const groups: Partial<Record<CommandItem["group"], CommandItem[]>> = {};
    for (const item of regularItems) {
      const group = groups[item.group] ?? [];
      group.push(item);
      groups[item.group] = group;
    }
    const sections: CommandSection[] = [];
    if (!normalizedQuery && recentItems.length > 0) {
      sections.push({ key: "recent", label: "最近使用", items: recentItems });
    }
    for (const groupKey of GROUP_ORDER) {
      const group = groups[groupKey];
      if (group && group.length > 0) {
        sections.push({ key: groupKey, label: GROUP_LABELS[groupKey], items: group });
      }
    }
    return sections;
  }, [normalizedQuery, recentItems, regularItems]);

  const safeActiveIndex = visibleItems.length === 0 ? 0 : Math.min(activeIndex, visibleItems.length - 1);
  const resultCountLabel = `共 ${visibleItems.length} 个命令`;
  const activePositionLabel = visibleItems.length > 0 ? `当前 ${safeActiveIndex + 1}/${visibleItems.length}` : "当前 0/0";

  const recordRecentCommand = useCallback((id: string) => {
    setRecentCommandIds((current) => {
      const next = [id, ...current.filter((currentId) => currentId !== id)].slice(0, MAX_RECENT_COMMANDS);
      persistRecentCommandIds(next);
      return next;
    });
  }, []);

  const executeCommand = useCallback((item: CommandItem) => {
    recordRecentCommand(item.id);
    item.perform();
    onClose();
  }, [onClose, recordRecentCommand]);

  useEffect(() => {
    if (open && inputRef.current) {
      setActiveIndex(0);
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const activeOption = listRef.current?.querySelector<HTMLElement>(`[data-command-index="${safeActiveIndex}"]`);
    activeOption?.scrollIntoView?.({ block: "nearest" });
  }, [safeActiveIndex, visibleItems]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex(visibleItems.length === 0 ? 0 : Math.min(safeActiveIndex + 1, visibleItems.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(Math.max(safeActiveIndex - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = visibleItems[safeActiveIndex];
        if (item) {
          executeCommand(item);
        }
        return;
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, visibleItems, safeActiveIndex, executeCommand, onClose]);

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
          {visibleItems.length === 0 ? (
            <div className="command-palette-empty">
              <Search size={32} />
              <span>没有匹配的命令</span>
            </div>
          ) : (
            commandSections.map((section) => {
              return (
                <div key={section.key} className={`command-palette-group command-palette-group-${section.key}`}>
                  <div className="command-palette-group-label">{section.label}</div>
                  {section.items.map((item) => {
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
                        onClick={() => executeCommand(item)}
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
