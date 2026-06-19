import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:asset-tags";

function loadTags(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function persist(tags: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch {
    // localStorage may be full
  }
}

export function useAssetTags() {
  const [tags, setTags] = useState<Record<string, string[]>>(loadTags);

  useEffect(() => {
    persist(tags);
  }, [tags]);

  const addTag = useCallback((assetId: string, tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) return;
    setTags((prev) => {
      const existing = prev[assetId] || [];
      if (existing.includes(normalized)) return prev;
      return { ...prev, [assetId]: [...existing, normalized] };
    });
  }, []);

  const removeTag = useCallback((assetId: string, tag: string) => {
    setTags((prev) => {
      const existing = prev[assetId] || [];
      const next = existing.filter((t) => t !== tag);
      if (next.length === 0) {
        const rest = { ...prev };
        delete rest[assetId];
        return rest;
      }
      return { ...prev, [assetId]: next };
    });
  }, []);

  const getTags = useCallback((assetId: string): string[] => tags[assetId] || [], [tags]);

  const allTags = useCallback((): string[] => {
    const set = new Set<string>();
    for (const list of Object.values(tags)) {
      for (const t of list) set.add(t);
    }
    return Array.from(set).sort();
  }, [tags]);

  return { tags, addTag, removeTag, getTags, allTags };
}
