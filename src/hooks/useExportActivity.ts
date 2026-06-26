import { useCallback, useEffect, useState } from "react";

export const EXPORT_ACTIVITY_STORAGE_KEY = "cstd-design:exportActivity:v1";
const EXPORT_ACTIVITY_VERSION = 1;
const MAX_EXPORT_ACTIVITIES = 20;

export type ExportActivityFormat = "markdown" | "html" | "pdf" | "text" | "notion" | "obsidian";

export type ExportActivity = {
  id: string;
  title: string;
  format: ExportActivityFormat;
  count: number;
  createdAt: string;
};

export type ExportActivityInput = Omit<ExportActivity, "createdAt"> & { createdAt?: string };

type ExportActivityEnvelope = {
  version: typeof EXPORT_ACTIVITY_VERSION;
  activities: ExportActivity[];
};

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isExportFormat(value: unknown): value is ExportActivityFormat {
  return value === "markdown"
    || value === "html"
    || value === "pdf"
    || value === "text"
    || value === "notion"
    || value === "obsidian";
}

function isExportActivity(value: unknown): value is ExportActivity {
  if (!value || typeof value !== "object") return false;
  const activity = value as Partial<ExportActivity>;
  return typeof activity.id === "string"
    && typeof activity.title === "string"
    && isExportFormat(activity.format)
    && typeof activity.count === "number"
    && Number.isFinite(activity.count)
    && activity.count >= 0
    && typeof activity.createdAt === "string";
}

function orderAndTrim(activities: ExportActivity[]) {
  return [...activities]
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))
    .slice(0, MAX_EXPORT_ACTIVITIES);
}

function loadActivities(): ExportActivity[] {
  try {
    const raw = localStorage.getItem(EXPORT_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<ExportActivityEnvelope>;
    if (parsed.version !== EXPORT_ACTIVITY_VERSION || !Array.isArray(parsed.activities)) return [];
    return orderAndTrim(parsed.activities.filter(isExportActivity));
  } catch {
    return [];
  }
}

function persist(activities: ExportActivity[]) {
  try {
    localStorage.setItem(EXPORT_ACTIVITY_STORAGE_KEY, JSON.stringify({
      version: EXPORT_ACTIVITY_VERSION,
      activities: orderAndTrim(activities),
    }));
  } catch {
    /* ignore storage errors */
  }
}

export function useExportActivity() {
  const [activities, setActivities] = useState<ExportActivity[]>(loadActivities);

  useEffect(() => persist(activities), [activities]);

  const record = useCallback((input: ExportActivityInput) => {
    const activity = { ...input, createdAt: input.createdAt || new Date().toISOString() } as ExportActivity;
    setActivities((current) => orderAndTrim([activity, ...current.filter((item) => item.id !== activity.id)]));
  }, []);

  const clear = useCallback(() => setActivities([]), []);

  return { activities, record, clear };
}
