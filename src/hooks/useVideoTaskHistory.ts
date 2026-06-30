import { useEffect, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:video-task-history";

export interface VideoTaskHistoryEntry {
  id: string;
  prompt: string;
  status: "completed" | "failed" | "abandoned";
  finishedAt: string;
  assetUrl?: string;
}

function isVideoTaskHistoryEntry(value: unknown): value is VideoTaskHistoryEntry {
  return isPlainRecord(value)
    && typeof value.id === "string"
    && typeof value.prompt === "string"
    && (value.status === "completed" || value.status === "failed" || value.status === "abandoned")
    && typeof value.finishedAt === "string";
}

function isVideoTaskHistory(value: unknown): value is VideoTaskHistoryEntry[] {
  return Array.isArray(value) && value.every(isVideoTaskHistoryEntry);
}

function load(): VideoTaskHistoryEntry[] {
  return parseStoredJson(localStorage.getItem(STORAGE_KEY), [], isVideoTaskHistory);
}

function save(tasks: VideoTaskHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, 30)));
  } catch {
    /* ignore */
  }
}

export function useVideoTaskHistory() {
  const [history, setHistory] = useState<VideoTaskHistoryEntry[]>(load);

  useEffect(() => {
    save(history);
  }, [history]);

  return {
    history,
    add: (entry: VideoTaskHistoryEntry) => setHistory((prev) => [entry, ...prev].slice(0, 30)),
    remove: (id: string) => setHistory((prev) => prev.filter((h) => h.id !== id)),
    clear: () => setHistory([]),
  };
}
