import { useCallback, useState } from "react";
import { isPlainRecord, isStringArray, parseStoredJson } from "../utils/storageJson";

interface AssetMetadata {
  title?: string;
  description?: string;
  tags: string[];
}

const STORAGE_KEY = "cstd-design:asset-metadata-edit";

function isAssetMetadata(value: unknown): value is AssetMetadata {
  return isPlainRecord(value)
    && isStringArray(value.tags)
    && (value.title === undefined || typeof value.title === "string")
    && (value.description === undefined || typeof value.description === "string");
}

function loadMetadata(): Record<string, AssetMetadata> {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const metadataByAsset: Record<string, AssetMetadata> = {};
  for (const [assetId, metadata] of Object.entries(parsed)) {
    if (isAssetMetadata(metadata)) metadataByAsset[assetId] = metadata;
  }
  return metadataByAsset;
}

function saveMetadata(data: Record<string, AssetMetadata>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useAssetMetadataEdit() {
  const [metadata, setMetadata] = useState<Record<string, AssetMetadata>>(loadMetadata);

  const getMetadata = useCallback((assetId: string): AssetMetadata => {
    return metadata[assetId] || { title: "", description: "", tags: [] };
  }, [metadata]);

  const setTitle = useCallback((assetId: string, title: string) => {
    setMetadata((prev) => {
      const existing = prev[assetId] || { title: "", description: "", tags: [] };
      const next = { ...prev, [assetId]: { ...existing, title } };
      saveMetadata(next);
      return next;
    });
  }, []);

  const setDescription = useCallback((assetId: string, description: string) => {
    setMetadata((prev) => {
      const existing = prev[assetId] || { title: "", description: "", tags: [] };
      const next = { ...prev, [assetId]: { ...existing, description } };
      saveMetadata(next);
      return next;
    });
  }, []);

  const addTag = useCallback((assetId: string, tag: string) => {
    setMetadata((prev) => {
      const existing = prev[assetId] || { title: "", description: "", tags: [] };
      if (existing.tags.includes(tag)) return prev;
      const next = { ...prev, [assetId]: { ...existing, tags: [...existing.tags, tag] } };
      saveMetadata(next);
      return next;
    });
  }, []);

  const removeTag = useCallback((assetId: string, tag: string) => {
    setMetadata((prev) => {
      const existing = prev[assetId] || { title: "", description: "", tags: [] };
      const next = { ...prev, [assetId]: { ...existing, tags: existing.tags.filter((t) => t !== tag) } };
      saveMetadata(next);
      return next;
    });
  }, []);

  return { getMetadata, setTitle, setDescription, addTag, removeTag };
}
