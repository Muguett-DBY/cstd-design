import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:editedMessages";

interface EditRecord {
  originalContent: string;
  editedContent: string;
  editedAt: string;
}

type EditedMessages = Record<string, EditRecord[]>;

function loadEdited(): EditedMessages {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveEdited(edited: EditedMessages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(edited));
}

export function useMessageEditing() {
  const [edited, setEdited] = useState<EditedMessages>(loadEdited);

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

  const editMessage = useCallback((messageId: string, originalContent: string, newContent: string) => {
    setEdited((prev) => {
      const history = prev[messageId] || [];
      const updated = {
        ...prev,
        [messageId]: [
          ...history,
          {
            originalContent,
            editedContent: newContent,
            editedAt: new Date().toISOString(),
          },
        ],
      };
      saveEdited(updated);
      return updated;
    });
  }, []);

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
