import { useCallback, useState } from "react";
import {
  type LibraryPrompt,
  type PromptCategory,
  getSeedPrompts,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from "./promptLibrary";

const STORAGE_KEY = "cstd-design:prompt-library";

function loadLibrary(): LibraryPrompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getSeedPrompts();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getSeedPrompts();
    return parsed.filter(
      (p): p is LibraryPrompt => p && typeof p.id === "string" && typeof p.text === "string"
    );
  } catch {
    return getSeedPrompts();
  }
}

function saveLibrary(prompts: LibraryPrompt[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch {
    // ignore
  }
}

export function usePromptLibrary() {
  const [prompts, setPrompts] = useState<LibraryPrompt[]>(loadLibrary);

  const addPrompt = useCallback((text: string, category: PromptCategory) => {
    const newPrompt: LibraryPrompt = {
      id: `custom-${Date.now()}`,
      text,
      category,
      icon: CATEGORY_ICONS[category],
      isFavorite: false,
      useCount: 0,
      lastUsedAt: null,
      createdAt: Date.now(),
    };
    setPrompts((prev) => {
      const next = [...prev, newPrompt];
      saveLibrary(next);
      return next;
    });
  }, []);

  const removePrompt = useCallback((id: string) => {
    setPrompts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveLibrary(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPrompts((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      );
      saveLibrary(next);
      return next;
    });
  }, []);

  const recordUsage = useCallback((id: string) => {
    setPrompts((prev) => {
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, useCount: p.useCount + 1, lastUsedAt: Date.now() }
          : p
      );
      saveLibrary(next);
      return next;
    });
  }, []);

  const getByCategory = useCallback((category: PromptCategory): LibraryPrompt[] => {
    return prompts.filter((p) => p.category === category);
  }, [prompts]);

  const search = useCallback((query: string): LibraryPrompt[] => {
    const q = query.toLowerCase();
    return prompts.filter(
      (p) => p.text.toLowerCase().includes(q) || p.category.includes(q)
    );
  }, [prompts]);

  const getFavorites = useCallback((): LibraryPrompt[] => {
    return prompts.filter((p) => p.isFavorite);
  }, [prompts]);

  const getMostUsed = useCallback((limit: number = 5): LibraryPrompt[] => {
    return [...prompts]
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit);
  }, [prompts]);

  const getRecentlyUsed = useCallback((limit: number = 5): LibraryPrompt[] => {
    return [...prompts]
      .filter((p) => p.lastUsedAt !== null)
      .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
      .slice(0, limit);
  }, [prompts]);

  return {
    prompts,
    addPrompt,
    removePrompt,
    toggleFavorite,
    recordUsage,
    getByCategory,
    search,
    getFavorites,
    getMostUsed,
    getRecentlyUsed,
    categories: CATEGORY_LABELS,
    categoryIcons: CATEGORY_ICONS,
  };
}
