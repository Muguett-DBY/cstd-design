import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:prompt-history";
const MAX_ENTRIES = 100;
const SUGGESTION_DEBOUNCE_MS = 120;

type HistoryEntry = {
  text: string;
  count: number;
  lastUsed: number;
};

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is HistoryEntry => e && typeof e.text === "string" && e.text.length > 0)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，.。!！?？;；:：、]+/)
    .filter((t) => t.length > 0);
}

function scoreEntry(entry: HistoryEntry, queryTokens: string[]): number {
  if (queryTokens.length === 0) {
    return entry.count;
  }
  const entryTokens = new Set(tokenize(entry.text));
  let matches = 0;
  for (const qt of queryTokens) {
    for (const et of entryTokens) {
      if (et === qt || et.startsWith(qt) || qt.startsWith(et)) {
        matches += 1;
        break;
      }
    }
  }
  if (matches === 0) return 0;
  const coverage = matches / Math.max(queryTokens.length, entryTokens.size);
  return matches * 10 + coverage * 5 + entry.count;
}

export function usePromptHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const recordPrompt = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) return;
    setHistory((prev) => {
      const idx = prev.findIndex((e) => e.text === trimmed);
      let next: HistoryEntry[];
      if (idx >= 0) {
        next = prev.slice();
        next[idx] = { ...next[idx], count: next[idx].count + 1, lastUsed: Date.now() };
      } else {
        next = [{ text: trimmed, count: 1, lastUsed: Date.now() }, ...prev];
      }
      next.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
      const trimmed2 = next.slice(0, MAX_ENTRIES);
      saveHistory(trimmed2);
      return trimmed2;
    });
  }, []);

  return { history, recordPrompt };
}

export function usePromptSuggestions(text: string, history: HistoryEntry[], limit = 3) {
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedText(text), SUGGESTION_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text]);

  const trimmed = debouncedText.trim();
  if (trimmed.length < 1) return [];
  const queryTokens = tokenize(trimmed);
  return history
    .filter((e) => e.text !== trimmed)
    .map((e) => ({ text: e.text, score: scoreEntry(e, queryTokens) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.text);
}
