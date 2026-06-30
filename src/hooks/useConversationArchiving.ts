import { useCallback, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:archivedConversations";

type ArchivedConversations = Record<string, boolean>;

function loadArchived(): ArchivedConversations {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const archivedByConversation: ArchivedConversations = {};
  for (const [conversationId, archived] of Object.entries(parsed)) {
    if (typeof archived === "boolean") archivedByConversation[conversationId] = archived;
  }
  return archivedByConversation;
}

function saveArchived(archived: ArchivedConversations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(archived));
}

export function useConversationArchiving() {
  const [archived, setArchived] = useState<ArchivedConversations>(loadArchived);

  const isArchived = useCallback((conversationId: string): boolean => {
    return archived[conversationId] || false;
  }, [archived]);

  const toggleArchive = useCallback((conversationId: string) => {
    setArchived((prev) => {
      const updated = { ...prev, [conversationId]: !prev[conversationId] };
      saveArchived(updated);
      return updated;
    });
  }, []);

  const archiveConversation = useCallback((conversationId: string) => {
    setArchived((prev) => {
      const updated = { ...prev, [conversationId]: true };
      saveArchived(updated);
      return updated;
    });
  }, []);

  const unarchiveConversation = useCallback((conversationId: string) => {
    setArchived((prev) => {
      const updated = { ...prev, [conversationId]: false };
      saveArchived(updated);
      return updated;
    });
  }, []);

  const getArchivedConversations = useCallback((conversationIds: string[]): string[] => {
    return conversationIds.filter((id) => archived[id]);
  }, [archived]);

  const getUnarchivedConversations = useCallback((conversationIds: string[]): string[] => {
    return conversationIds.filter((id) => !archived[id]);
  }, [archived]);

  const bulkArchive = useCallback((conversationIds: string[]) => {
    setArchived((prev) => {
      const updated = { ...prev };
      for (const id of conversationIds) {
        updated[id] = true;
      }
      saveArchived(updated);
      return updated;
    });
  }, []);

  const bulkUnarchive = useCallback((conversationIds: string[]) => {
    setArchived((prev) => {
      const updated = { ...prev };
      for (const id of conversationIds) {
        updated[id] = false;
      }
      saveArchived(updated);
      return updated;
    });
  }, []);

  return {
    isArchived,
    toggleArchive,
    archiveConversation,
    unarchiveConversation,
    getArchivedConversations,
    getUnarchivedConversations,
    bulkArchive,
    bulkUnarchive,
  };
}
