import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:saved-searches";

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  roleFilter: "all" | "user" | "assistant";
  dateFilter: "all" | "today" | "week" | "month";
  createdAt: string;
}

function loadSaved(): SavedSearch[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is SavedSearch => (
      entry
      && typeof entry.id === "string"
      && typeof entry.name === "string"
      && typeof entry.query === "string"
      && ["all", "user", "assistant"].includes(entry.roleFilter)
      && ["all", "today", "week", "month"].includes(entry.dateFilter)
      && typeof entry.createdAt === "string"
      && Number.isFinite(Date.parse(entry.createdAt))
    ));
  } catch {
    return [];
  }
}

function persist(saved: SavedSearch[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // localStorage may be full or disabled
  }
}

export function useSavedSearches() {
  const [saved, setSaved] = useState<SavedSearch[]>(loadSaved);

  const add = useCallback((entry: Omit<SavedSearch, "id" | "createdAt">) => {
    const newEntry: SavedSearch = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
    };
    setSaved((prev) => {
      const next = [newEntry, ...prev].slice(0, 20);
      persist(next);
      return next;
    });
    return newEntry;
  }, []);

  const remove = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { saved, add, remove };
}
