import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "cstd-design:activeVideoTask";

export interface PersistedVideoTask {
  id: string;
  status: string;
  progress: number;
  assetUrl?: string;
  startedAt?: string;
}

function loadActiveTask(): PersistedVideoTask | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.status === "completed" || parsed.status === "failed") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveActiveTask(task: PersistedVideoTask | null) {
  try {
    if (task) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(task));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

export function useVideoTaskPersistence() {
  const [task, setTask] = useState<PersistedVideoTask | null>(loadActiveTask);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    saveActiveTask(task);
  }, [task]);

  const updateTask = (updater: PersistedVideoTask | null) => {
    if (updater && !updater.startedAt) {
      setTask({ ...updater, startedAt: new Date().toISOString() });
    } else {
      setTask(updater);
    }
  };

  return { task, setTask: updateTask, clearTask: () => setTask(null) };
}
