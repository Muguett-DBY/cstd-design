import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

interface EditRecord {
  originalContent: string;
  editedContent: string;
  editedAt: string;
}

export function useMessageEditing(conversationId: string | null) {
  const [edited, setEdited] = useState<Record<string, EditRecord[]>>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!conversationId) {
      loadedRef.current = true;
      return;
    }
    loadedRef.current = false;
    api.edits(conversationId)
      .then((res) => {
        const map: Record<string, EditRecord[]> = {};
        for (const [msgId, edits] of Object.entries(res.edits)) {
          map[msgId] = edits.map((e) => ({
            originalContent: e.originalContent,
            editedContent: e.editedContent,
            editedAt: e.createdAt,
          }));
        }
        setEdited(map);
        loadedRef.current = true;
      })
      .catch(() => { loadedRef.current = true; });
  }, [conversationId]);

  const getEditedContent = useCallback((messageId: string): string | null => {
    const history = edited[messageId];
    if (history && history.length > 0) {
      return history[history.length - 1].editedContent;
    }
    return null;
  }, [edited]);

  const getEditHistory = useCallback((messageId: string): EditRecord[] => {
    return edited[messageId] || [];
  }, [edited]);

  const editMessage = useCallback(async (messageId: string, originalContent: string, newContent: string) => {
    if (!conversationId) return;
    const record: EditRecord = {
      originalContent,
      editedContent: newContent,
      editedAt: new Date().toISOString(),
    };
    setEdited((prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), record],
    }));
    try {
      await api.addEdit(conversationId, messageId, originalContent, newContent);
    } catch {
      setEdited((prev) => ({
        ...prev,
        [messageId]: (prev[messageId] || []).filter((e) => e.editedAt !== record.editedAt),
      }));
    }
  }, [conversationId]);

  const isEdited = useCallback((messageId: string): boolean => {
    return !!edited[messageId] && edited[messageId].length > 0;
  }, [edited]);

  const getEditCount = useCallback((messageId: string): number => {
    return edited[messageId]?.length || 0;
  }, [edited]);

  return {
    getEditedContent,
    getEditHistory,
    editMessage,
    isEdited,
    getEditCount,
  };
}
