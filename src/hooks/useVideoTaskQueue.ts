import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "cstd-design:video-task-queue";

export interface QueuedVideoTask {
  id: string;
  status: "in_progress" | "completed" | "failed" | "queued";
  progress: number;
  prompt: string;
  assetUrl?: string;
  startedAt: string;
  finishedAt?: string;
}

function loadQueue(): QueuedVideoTask[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((t) => t.status !== "completed" || (Date.now() - new Date(t.finishedAt || t.startedAt).getTime() < 24 * 60 * 60 * 1000)) : [];
  } catch {
    return [];
  }
}

function saveQueue(tasks: QueuedVideoTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore */
  }
}

export function useVideoTaskQueue() {
  const [tasks, setTasks] = useState<QueuedVideoTask[]>(loadQueue);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }
    saveQueue(tasks);
  }, [tasks]);

  const addTask = useCallback((prompt: string, id: string) => {
    setTasks((prev) => [
      { id, prompt, status: "in_progress", progress: 0, startedAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<QueuedVideoTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const completeTask = useCallback((id: string, assetUrl?: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "completed", progress: 100, assetUrl, finishedAt: new Date().toISOString() } : t)));
  }, []);

  const failTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "failed", finishedAt: new Date().toISOString() } : t)));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === "in_progress" || t.status === "queued"));
  }, []);

  return { tasks, addTask, updateTask, completeTask, failTask, removeTask, clearCompleted };
}
