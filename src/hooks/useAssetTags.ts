import { useCallback, useEffect, useState } from "react";
import { isPlainRecord, isStringArray, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:asset-tags";

function loadTags(): Record<string, string[]> {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const tagsByAsset: Record<string, string[]> = {};
  for (const [assetId, tags] of Object.entries(parsed)) {
    if (isStringArray(tags)) tagsByAsset[assetId] = tags;
  }
  return tagsByAsset;
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

  const tagFrequency = useCallback((): Record<string, number> => {
    const freq: Record<string, number> = {};
    for (const list of Object.values(tags)) {
      for (const t of list) {
        freq[t] = (freq[t] || 0) + 1;
      }
    }
    return freq;
  }, [tags]);

  const suggestTags = useCallback((source: string, limit = 4): string[] => {
    const freq = tagFrequency();
    const tokens = source
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fff]+/)
      .filter((t) => t.length >= 2);
    if (tokens.length === 0) return [];
    const scored = Object.entries(freq)
      .map(([tag, count]) => {
        let matches = 0;
        for (const tok of tokens) {
          if (tag.includes(tok) || tok.includes(tag)) matches += 1;
        }
        return { tag, score: matches * 10 + count, matches };
      })
      .filter((s) => s.matches > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.tag);
    return scored;
  }, [tagFrequency]);

  return { tags, addTag, removeTag, getTags, allTags, tagFrequency, suggestTags };
}
