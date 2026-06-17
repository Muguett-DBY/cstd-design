import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:conversationFolders";
const FOLDER_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444"];

export interface Folder {
  id: string;
  name: string;
  color: string;
}

type FolderAssignments = Record<string, string>;

function loadFolders(): Folder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFolders(folders: Folder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
}

function loadAssignments(): FolderAssignments {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}:assignments`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveAssignments(assignments: FolderAssignments) {
  localStorage.setItem(`${STORAGE_KEY}:assignments`, JSON.stringify(assignments));
}

export function useConversationFolders() {
  const [folders, setFolders] = useState<Folder[]>(loadFolders);
  const [assignments, setAssignments] = useState<FolderAssignments>(loadAssignments);

  const createFolder = useCallback((name: string) => {
    const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      color,
    };
    setFolders((prev) => {
      const updated = [...prev, newFolder];
      saveFolders(updated);
      return updated;
    });
    return newFolder;
  }, [folders.length]);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      saveFolders(updated);
      return updated;
    });
    setAssignments((prev) => {
      const updated = { ...prev };
      for (const [convId, fId] of Object.entries(updated)) {
        if (fId === folderId) delete updated[convId];
      }
      saveAssignments(updated);
      return updated;
    });
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) => f.id === folderId ? { ...f, name } : f);
      saveFolders(updated);
      return updated;
    });
  }, []);

  const assignToFolder = useCallback((conversationId: string, folderId: string | null) => {
    setAssignments((prev) => {
      const updated = { ...prev };
      if (folderId) {
        updated[conversationId] = folderId;
      } else {
        delete updated[conversationId];
      }
      saveAssignments(updated);
      return updated;
    });
  }, []);

  const getConversationFolder = useCallback((conversationId: string): Folder | null => {
    const folderId = assignments[conversationId];
    if (!folderId) return null;
    return folders.find((f) => f.id === folderId) || null;
  }, [assignments, folders]);

  const getFolderConversations = useCallback((folderId: string): string[] => {
    return Object.entries(assignments)
      .filter(([, fId]) => fId === folderId)
      .map(([convId]) => convId);
  }, [assignments]);

  return {
    folders,
    createFolder,
    deleteFolder,
    renameFolder,
    assignToFolder,
    getConversationFolder,
    getFolderConversations,
    folderColors: FOLDER_COLORS,
  };
}
