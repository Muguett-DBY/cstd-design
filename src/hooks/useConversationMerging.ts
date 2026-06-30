import { useCallback, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:mergedConversations";

interface MergeRecord {
  sourceId: string;
  targetId: string;
  mergedAt: string;
}

type MergedConversations = Record<string, MergeRecord>;

function isMergeRecord(value: unknown): value is MergeRecord {
  return isPlainRecord(value)
    && typeof value.sourceId === "string"
    && typeof value.targetId === "string"
    && typeof value.mergedAt === "string";
}

function loadMerged(): MergedConversations {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const mergedBySource: MergedConversations = {};
  for (const [sourceId, record] of Object.entries(parsed)) {
    if (isMergeRecord(record)) mergedBySource[sourceId] = record;
  }
  return mergedBySource;
}

function saveMerged(merged: MergedConversations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function useConversationMerging() {
  const [merged, setMerged] = useState<MergedConversations>(loadMerged);

  const getMergeRecord = useCallback((conversationId: string): MergeRecord | null => {
    return merged[conversationId] || null;
  }, [merged]);

  const isMerged = useCallback((conversationId: string): boolean => {
    return !!merged[conversationId];
  }, [merged]);

  const mergeConversations = useCallback((sourceId: string, targetId: string) => {
    setMerged((prev) => {
      const updated = {
        ...prev,
        [sourceId]: {
          sourceId,
          targetId,
          mergedAt: new Date().toISOString(),
        },
      };
      saveMerged(updated);
      return updated;
    });
  }, []);

  const unmergeConversation = useCallback((sourceId: string) => {
    setMerged((prev) => {
      const updated = { ...prev };
      delete updated[sourceId];
      saveMerged(updated);
      return updated;
    });
  }, []);

  const getMergedConversations = useCallback((conversationIds: string[]): string[] => {
    return conversationIds.filter((id) => merged[id]);
  }, [merged]);

  const getUnmergedConversations = useCallback((conversationIds: string[]): string[] => {
    return conversationIds.filter((id) => !merged[id]);
  }, [merged]);

  return {
    getMergeRecord,
    isMerged,
    mergeConversations,
    unmergeConversation,
    getMergedConversations,
    getUnmergedConversations,
    merged,
  };
}
