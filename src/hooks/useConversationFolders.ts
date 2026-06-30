import { useCallback, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:conversationFolders";
const FOLDER_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444"];

export interface Folder {
  id: string;
  name: string;
  color: string;
}

type FolderAssignments = Record<string, string>;

function isFolder(value: unknown): value is Folder {
  return isPlainRecord(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.color === "string";
}

function isFolderArray(value: unknown): value is Folder[] {
  return Array.isArray(value) && value.every(isFolder);
}

function loadFolders(): Folder[] {
  return parseStoredJson(localStorage.getItem(STORAGE_KEY), [], isFolderArray);
}

function saveFolders(folders: Folder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
}

function loadAssignments(): FolderAssignments {
  const parsed = parseStoredJson(localStorage.getItem(`${STORAGE_KEY}:assignments`), {}, isPlainRecord);
  const assignments: FolderAssignments = {};
  for (const [conversationId, folderId] of Object.entries(parsed)) {
    if (typeof folderId === "string") assignments[conversationId] = folderId;
  }
  return assignments;
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

  const autoCategorize = useCallback((conversations: { id: string; title: string }[]): number => {
    const keywordMap: Record<string, string[]> = {
      "图片": ["画", "图", "设计", "image", "图片", "海报", "logo", "图标"],
      "视频": ["视频", "动画", "video", "片头", "特效"],
      "代码": ["代码", "编程", "函数", "API", "bug", "code", "开发"],
      "文档": ["文档", "报告", "总结", "方案", "doc"],
    };
    let categorized = 0;
    for (const conv of conversations) {
      if (assignments[conv.id]) continue;
      const title = conv.title.toLowerCase();
      for (const [folderName, keywords] of Object.entries(keywordMap)) {
        if (keywords.some((kw) => title.includes(kw.toLowerCase()))) {
          let folder = folders.find((f) => f.name === folderName);
          if (!folder) {
            folder = createFolder(folderName);
          }
          if (folder) {
            assignToFolder(conv.id, folder.id);
            categorized++;
          }
          break;
        }
      }
    }
    return categorized;
  }, [folders, assignments, createFolder, assignToFolder]);

  return {
    folders,
    createFolder,
    deleteFolder,
    renameFolder,
    assignToFolder,
    getConversationFolder,
    getFolderConversations,
    autoCategorize,
    folderColors: FOLDER_COLORS,
  };
}
