import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:usage-stats";

export type UsageEventType = "message_sent" | "image_generated" | "video_generated" | "image_edited" | "video_abandoned";

export interface UsageEvent {
  type: UsageEventType;
  timestamp: string;
}

export interface UsageStats {
  messageSent: number;
  imageGenerated: number;
  videoGenerated: number;
  imageEdited: number;
  videoAbandoned: number;
  events: UsageEvent[];
}

const DEFAULT_STATS: UsageStats = {
  messageSent: 0,
  imageGenerated: 0,
  videoGenerated: 0,
  imageEdited: 0,
  videoAbandoned: 0,
  events: [],
};

function load(): UsageStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STATS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_STATS;
}

function save(stats: UsageStats) {
  try {
    const toSave = { ...stats, events: stats.events.slice(-200) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export function useUsageStats() {
  const [stats, setStats] = useState<UsageStats>(load);

  useEffect(() => {
    save(stats);
  }, [stats]);

  const record = useCallback((type: UsageEventType) => {
    setStats((prev) => {
      const key = type === "message_sent" ? "messageSent"
        : type === "image_generated" ? "imageGenerated"
        : type === "video_generated" ? "videoGenerated"
        : type === "image_edited" ? "imageEdited"
        : "videoAbandoned";
      const event: UsageEvent = { type, timestamp: new Date().toISOString() };
      return {
        ...prev,
        [key]: prev[key] + 1,
        events: [...prev.events, event].slice(-200),
      };
    });
  }, []);

  const reset = useCallback(() => setStats(DEFAULT_STATS), []);

  return { stats, record, reset };
}
