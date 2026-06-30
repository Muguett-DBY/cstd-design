import { useCallback, useEffect, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

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

function isUsageEvent(value: unknown): value is UsageEvent {
  return isPlainRecord(value)
    && (value.type === "message_sent" || value.type === "image_generated" || value.type === "video_generated" || value.type === "image_edited" || value.type === "video_abandoned")
    && typeof value.timestamp === "string";
}

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function load(): UsageStats {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  return {
    messageSent: readCount(parsed.messageSent),
    imageGenerated: readCount(parsed.imageGenerated),
    videoGenerated: readCount(parsed.videoGenerated),
    imageEdited: readCount(parsed.imageEdited),
    videoAbandoned: readCount(parsed.videoAbandoned),
    events: Array.isArray(parsed.events) ? parsed.events.filter(isUsageEvent).slice(-200) : [],
  };
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
