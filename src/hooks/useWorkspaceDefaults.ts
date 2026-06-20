import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:workspace-defaults";

type WorkspaceId = "chat" | "image" | "video" | "asset";

type WorkspaceDefaults = {
  [K in WorkspaceId]?: Record<string, unknown>;
};

function loadDefaults(): WorkspaceDefaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveDefaults(defaults: WorkspaceDefaults) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    // ignore
  }
}

export function useWorkspaceDefaults() {
  const [defaults, setDefaults] = useState<WorkspaceDefaults>(loadDefaults);

  const getDefaults = useCallback((workspace: WorkspaceId): Record<string, unknown> => {
    return defaults[workspace] || {};
  }, [defaults]);

  const setDefault = useCallback((workspace: WorkspaceId, key: string, value: unknown) => {
    setDefaults((prev) => {
      const next = { ...prev, [workspace]: { ...prev[workspace], [key]: value } };
      saveDefaults(next);
      return next;
    });
  }, []);

  const clearDefaults = useCallback((workspace: WorkspaceId) => {
    setDefaults((prev) => {
      const next = { ...prev };
      delete next[workspace];
      saveDefaults(next);
      return next;
    });
  }, []);

  return { getDefaults, setDefault, clearDefaults };
}
