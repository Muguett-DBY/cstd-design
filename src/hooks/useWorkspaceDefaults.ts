import { useCallback, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:workspace-defaults";

type WorkspaceId = "chat" | "image" | "video" | "asset";

type WorkspaceDefaults = {
  [K in WorkspaceId]?: Record<string, unknown>;
};

function isWorkspaceId(value: string): value is WorkspaceId {
  return value === "chat" || value === "image" || value === "video" || value === "asset";
}

function loadDefaults(): WorkspaceDefaults {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const defaults: WorkspaceDefaults = {};
  for (const [workspace, value] of Object.entries(parsed)) {
    if (isWorkspaceId(workspace) && isPlainRecord(value)) {
      defaults[workspace] = value;
    }
  }
  return defaults;
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
