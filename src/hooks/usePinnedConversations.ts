import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:pinned-conversations";

function loadPinned(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function persist(pinned: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(pinned)));
  } catch {
    // localStorage may be full
  }
}

export function usePinnedConversations() {
  const [pinned, setPinned] = useState<Set<string>>(loadPinned);

  useEffect(() => {
    persist(pinned);
  }, [pinned]);

  const toggle = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isPinned = useCallback((id: string) => pinned.has(id), [pinned]);

  const allPinned = useCallback((ids: string[]): boolean => ids.length > 0 && ids.every((id) => pinned.has(id)), [pinned]);

  const bulkPin = useCallback((ids: string[]) => {
    setPinned((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const bulkUnpin = useCallback((ids: string[]) => {
    setPinned((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  return { pinned, toggle, isPinned, allPinned, bulkPin, bulkUnpin };
}

export function partitionPinned<T extends { id: string }>(items: T[], pinned: Set<string>): { pinnedItems: T[]; otherItems: T[] } {
  const pinnedItems: T[] = [];
  const otherItems: T[] = [];
  for (const item of items) {
    if (pinned.has(item.id)) pinnedItems.push(item);
    else otherItems.push(item);
  }
  return { pinnedItems, otherItems };
}
