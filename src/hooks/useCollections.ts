import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:asset-collections";

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];
  createdAt: string;
  color?: string;
}

function loadCollections(): AssetCollection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function persist(collections: AssetCollection[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch {
    // ignore
  }
}

export function useCollections() {
  const [collections, setCollections] = useState<AssetCollection[]>(loadCollections);

  useEffect(() => {
    persist(collections);
  }, [collections]);

  const create = useCallback((name: string, description?: string, color?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const newCollection: AssetCollection = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: trimmed,
      description: description?.trim() || undefined,
      assetIds: [],
      createdAt: new Date().toISOString(),
      color,
    };
    setCollections((prev) => [newCollection, ...prev]);
    return newCollection;
  }, []);

  const remove = useCallback((id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const update = useCallback((id: string, updates: Partial<Omit<AssetCollection, "id" | "createdAt">>) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const addAsset = useCallback((collectionId: string, assetId: string) => {
    setCollections((prev) => prev.map((c) => {
      if (c.id === collectionId && !c.assetIds.includes(assetId)) {
        return { ...c, assetIds: [...c.assetIds, assetId] };
      }
      return c;
    }));
  }, []);

  const removeAsset = useCallback((collectionId: string, assetId: string) => {
    setCollections((prev) => prev.map((c) => {
      if (c.id === collectionId) {
        return { ...c, assetIds: c.assetIds.filter((id) => id !== assetId) };
      }
      return c;
    }));
  }, []);

  const getAssetCollections = useCallback((assetId: string) => {
    return collections.filter((c) => c.assetIds.includes(assetId));
  }, [collections]);

  const filterByCollection = useCallback((assetIds: string[], collectionId: string | null): string[] => {
    if (!collectionId) return assetIds;
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return assetIds;
    return assetIds.filter((id) => collection.assetIds.includes(id));
  }, [collections]);

  return {
    collections,
    create,
    remove,
    update,
    addAsset,
    removeAsset,
    getAssetCollections,
    filterByCollection,
  };
}
