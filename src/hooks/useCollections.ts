import { useCallback, useEffect, useState } from "react";
import { isPlainRecord, isStringArray, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:asset-collections";

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];
  createdAt: string;
  color?: string;
}

function isAssetCollection(value: unknown): value is AssetCollection {
  return isPlainRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && isStringArray(value.assetIds)
    && typeof value.createdAt === "string"
    && (value.description === undefined || typeof value.description === "string")
    && (value.color === undefined || typeof value.color === "string");
}

function isAssetCollectionArray(value: unknown): value is AssetCollection[] {
  return Array.isArray(value) && value.every(isAssetCollection);
}

function loadCollections(): AssetCollection[] {
  return parseStoredJson(localStorage.getItem(STORAGE_KEY), [], isAssetCollectionArray);
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
