import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:asset-versions";
const MAX_VERSIONS = 10;

type AssetVersion = {
  id: string;
  assetId: string;
  timestamp: string;
  changes: Record<string, unknown>;
  description: string;
};

function loadVersions(): AssetVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is AssetVersion =>
      v && typeof v.id === "string" && typeof v.assetId === "string"
    );
  } catch {
    return [];
  }
}

function persistVersions(versions: AssetVersion[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions.slice(-200)));
  } catch {
    // ignore
  }
}

export function useAssetVersions() {
  const [versions, setVersions] = useState<AssetVersion[]>(loadVersions);

  useEffect(() => {
    persistVersions(versions);
  }, [versions]);

  const recordVersion = useCallback((assetId: string, changes: Record<string, unknown>, description: string) => {
    const version: AssetVersion = {
      id: crypto.randomUUID(),
      assetId,
      timestamp: new Date().toISOString(),
      changes,
      description,
    };
    setVersions((prev) => {
      const assetVersions = prev.filter((v) => v.assetId === assetId);
      const otherVersions = prev.filter((v) => v.assetId !== assetId);
      const next = [...assetVersions, version].slice(-MAX_VERSIONS);
      return [...otherVersions, ...next];
    });
  }, []);

  const getVersions = useCallback((assetId: string): AssetVersion[] => {
    return versions
      .filter((v) => v.assetId === assetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [versions]);

  const getLatestVersion = useCallback((assetId: string): AssetVersion | null => {
    const assetVersions = versions.filter((v) => v.assetId === assetId);
    return assetVersions.length > 0 ? assetVersions[assetVersions.length - 1] : null;
  }, [versions]);

  return { recordVersion, getVersions, getLatestVersion };
}
