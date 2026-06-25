import { useCallback, useEffect, useState } from "react";
import type { WorkspaceTab } from "../types";

export const CREATION_ACTIVITY_STORAGE_KEY = "cstd-design:creationActivity:v1";
const ACTIVITY_VERSION = 1;
const MAX_ACTIVITIES = 30;

export type CreationActivityType = "restored" | "completed" | "ignored";

export type CreationActivity = {
  id: string;
  type: CreationActivityType;
  workspace: WorkspaceTab;
  label: string;
  createdAt: string;
};

export type CreationActivityInput = Omit<CreationActivity, "createdAt"> & { createdAt?: string };

type ActivityEnvelope = {
  version: typeof ACTIVITY_VERSION;
  activities: CreationActivity[];
};

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isActivity(value: unknown): value is CreationActivity {
  if (!value || typeof value !== "object") return false;
  const activity = value as Partial<CreationActivity>;
  return typeof activity.id === "string"
    && (activity.type === "restored" || activity.type === "completed" || activity.type === "ignored")
    && (activity.workspace === "chat" || activity.workspace === "image" || activity.workspace === "video" || activity.workspace === "assets")
    && typeof activity.label === "string"
    && typeof activity.createdAt === "string";
}

function orderAndTrim(activities: CreationActivity[]) {
  return [...activities]
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt))
    .slice(0, MAX_ACTIVITIES);
}

function loadActivities(): CreationActivity[] {
  try {
    const raw = localStorage.getItem(CREATION_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<ActivityEnvelope>;
    if (parsed.version !== ACTIVITY_VERSION || !Array.isArray(parsed.activities)) return [];
    return orderAndTrim(parsed.activities.filter(isActivity));
  } catch {
    return [];
  }
}

function persist(activities: CreationActivity[]) {
  try {
    localStorage.setItem(CREATION_ACTIVITY_STORAGE_KEY, JSON.stringify({
      version: ACTIVITY_VERSION,
      activities: orderAndTrim(activities),
    }));
  } catch {
    /* ignore storage errors */
  }
}

export function useCreationActivity() {
  const [activities, setActivities] = useState<CreationActivity[]>(loadActivities);

  useEffect(() => persist(activities), [activities]);

  const record = useCallback((input: CreationActivityInput) => {
    const activity = { ...input, createdAt: input.createdAt || new Date().toISOString() } as CreationActivity;
    setActivities((current) => orderAndTrim([activity, ...current.filter((item) => item.id !== activity.id)]));
  }, []);

  const clear = useCallback(() => setActivities([]), []);

  return { activities, record, clear };
}
