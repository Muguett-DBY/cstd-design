import { useCallback, useEffect, useState } from "react";
import { CREATION_RECOVERY_STORAGE_KEY } from "../storage-keys";
import type { WorkspaceTab } from "../types";
import type { ImageGenerationRecipe } from "./useImageGenerationBatch";
import type { VideoGenerationRecipe } from "./useVideoTaskPersistence";

export { CREATION_RECOVERY_STORAGE_KEY };

const RECOVERY_VERSION = 1;
const MAX_RECOVERY_RECORDS = 20;

export type ChatRecoveryPayload = {
  content: string;
  parentId: string | null;
  conversationId?: string | null;
};

export type CreationRecoveryRecord =
  | {
      id: string;
      type: "chat";
      workspace: Extract<WorkspaceTab, "chat">;
      label: string;
      summary: string;
      createdAt: string;
      payload: ChatRecoveryPayload;
    }
  | {
      id: string;
      type: "image";
      workspace: Extract<WorkspaceTab, "image">;
      label: string;
      summary: string;
      createdAt: string;
      payload: ImageGenerationRecipe;
    }
  | {
      id: string;
      type: "video";
      workspace: Extract<WorkspaceTab, "video">;
      label: string;
      summary: string;
      createdAt: string;
      payload: VideoGenerationRecipe;
    };

export type CreationRecoveryInput = Omit<CreationRecoveryRecord, "createdAt"> & { createdAt?: string };

type RecoveryEnvelope = {
  version: typeof RECOVERY_VERSION;
  records: CreationRecoveryRecord[];
};

function isRecoveryRecord(value: unknown): value is CreationRecoveryRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CreationRecoveryRecord>;
  return typeof record.id === "string"
    && (record.type === "chat" || record.type === "image" || record.type === "video")
    && record.workspace === record.type
    && typeof record.label === "string"
    && typeof record.summary === "string"
    && typeof record.createdAt === "string"
    && typeof record.payload === "object"
    && record.payload !== null;
}

function orderAndTrim(records: CreationRecoveryRecord[]) {
  return [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_RECOVERY_RECORDS);
}

function loadRecords(): CreationRecoveryRecord[] {
  try {
    const stored = localStorage.getItem(CREATION_RECOVERY_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Partial<RecoveryEnvelope>;
    if (parsed.version !== RECOVERY_VERSION || !Array.isArray(parsed.records)) return [];
    return orderAndTrim(parsed.records.filter(isRecoveryRecord));
  } catch {
    return [];
  }
}

function persist(records: CreationRecoveryRecord[]) {
  localStorage.setItem(CREATION_RECOVERY_STORAGE_KEY, JSON.stringify({
    version: RECOVERY_VERSION,
    records: orderAndTrim(records),
  }));
}

export function useCreationRecovery() {
  const [records, setRecords] = useState<CreationRecoveryRecord[]>(() => loadRecords());

  useEffect(() => {
    persist(records);
  }, [records]);

  const upsert = useCallback((input: CreationRecoveryInput) => {
    const record = { ...input, createdAt: input.createdAt || new Date().toISOString() } as CreationRecoveryRecord;
    setRecords((current) => orderAndTrim([record, ...current.filter((item) => item.id !== record.id)]));
  }, []);

  const dismiss = useCallback((id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  }, []);

  const clear = useCallback(() => {
    setRecords([]);
  }, []);

  return { records, upsert, dismiss, clear };
}
