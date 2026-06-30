import { useCallback, useEffect, useRef, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

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

function isQueuedVideoTask(value: unknown): value is QueuedVideoTask {
  return isPlainRecord(value)
    && typeof value.id === "string"
    && (value.status === "in_progress" || value.status === "completed" || value.status === "failed" || value.status === "queued")
    && typeof value.progress === "number"
    && typeof value.prompt === "string"
    && typeof value.startedAt === "string"
    && (value.assetUrl === undefined || typeof value.assetUrl === "string")
    && (value.finishedAt === undefined || typeof value.finishedAt === "string");
}

function isQueuedVideoTaskArray(value: unknown): value is QueuedVideoTask[] {
  return Array.isArray(value) && value.every(isQueuedVideoTask);
}

function loadQueue(): QueuedVideoTask[] {
  return parseStoredJson(localStorage.getItem(STORAGE_KEY), [], isQueuedVideoTaskArray)
    .filter((task) => task.status !== "completed" || (Date.now() - new Date(task.finishedAt || task.startedAt).getTime() < 24 * 60 * 60 * 1000));
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
