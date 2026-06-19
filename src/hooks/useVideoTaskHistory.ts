import { useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:video-task-history";

export interface VideoTaskHistoryEntry {
  id: string;
  prompt: string;
  status: "completed" | "failed" | "abandoned";
  finishedAt: string;
  assetUrl?: string;
}

function load(): VideoTaskHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
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
