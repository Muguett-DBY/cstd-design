import { useEffect, useRef, useState } from "react";
import type { VideoPreset } from "../types";
import { isPlainRecord, isStringArray, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:activeVideoTask";

export interface PersistedVideoTask {
  id: string;
  status: string;
  progress: number;
  assetUrl?: string;
  startedAt?: string;
  recipe?: VideoGenerationRecipe;
}

export interface VideoGenerationRecipe {
  prompt: string;
  preset: VideoPreset;
  fps: number;
  width: number;
  height: number;
  referenceAssetIds: string[];
  keyframes: boolean;
  negativePrompt?: string;
  seed?: number;
}

function isVideoGenerationRecipe(value: unknown): value is VideoGenerationRecipe {
  return isPlainRecord(value)
    && typeof value.prompt === "string"
    && (value.preset === "short" || value.preset === "standard" || value.preset === "max")
    && typeof value.fps === "number"
    && typeof value.width === "number"
    && typeof value.height === "number"
    && isStringArray(value.referenceAssetIds)
    && typeof value.keyframes === "boolean"
    && (value.negativePrompt === undefined || typeof value.negativePrompt === "string")
    && (value.seed === undefined || typeof value.seed === "number");
}

function isPersistedVideoTask(value: unknown): value is PersistedVideoTask {
  return isPlainRecord(value)
    && typeof value.id === "string"
    && typeof value.status === "string"
    && typeof value.progress === "number"
    && (value.assetUrl === undefined || typeof value.assetUrl === "string")
    && (value.startedAt === undefined || typeof value.startedAt === "string")
    && (value.recipe === undefined || isVideoGenerationRecipe(value.recipe));
}

function loadActiveTask(): PersistedVideoTask | null {
  const parsed = parseStoredJson<PersistedVideoTask | null>(
    localStorage.getItem(STORAGE_KEY),
    null,
    (value): value is PersistedVideoTask | null => value === null || isPersistedVideoTask(value),
  );
  if (!parsed || parsed.status === "completed") return null;
  return parsed;
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
