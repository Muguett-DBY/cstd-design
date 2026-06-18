import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:messageThreads";

interface Thread {
  parentMessageId: string;
  replies: string[];
}

type Threads = Record<string, Thread>;

function loadThreads(): Threads {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveThreads(threads: Threads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function useMessageThreading() {
  const [threads, setThreads] = useState<Threads>(loadThreads);

  const getThread = useCallback((messageId: string): Thread | null => {
    return threads[messageId] || null;
  }, [threads]);

  const getThreadReplies = useCallback((messageId: string): string[] => {
    return threads[messageId]?.replies || [];
  }, [threads]);

  const addReply = useCallback((parentMessageId: string, replyContent: string) => {
    setThreads((prev) => {
      const existing = prev[parentMessageId] || { parentMessageId, replies: [] };
      const updated = {
        ...prev,
        [parentMessageId]: {
          ...existing,
          replies: [...existing.replies, replyContent],
        },
      };
      saveThreads(updated);
      return updated;
    });
  }, []);

  const removeReply = useCallback((parentMessageId: string, replyIndex: number) => {
    setThreads((prev) => {
      const existing = prev[parentMessageId];
      if (!existing) return prev;
      const updated = {
        ...prev,
        [parentMessageId]: {
          ...existing,
          replies: existing.replies.filter((_, i) => i !== replyIndex),
        },
      };
      saveThreads(updated);
      return updated;
    });
  }, []);

  const hasThread = useCallback((messageId: string): boolean => {
    return !!threads[messageId] && threads[messageId].replies.length > 0;
  }, [threads]);

  const getThreadCount = useCallback((messageId: string): number => {
    return threads[messageId]?.replies.length || 0;
  }, [threads]);

  const clearThread = useCallback((parentMessageId: string) => {
    setThreads((prev) => {
      const updated = { ...prev };
      delete updated[parentMessageId];
      saveThreads(updated);
      return updated;
    });
  }, []);

  return {
    threads,
    getThread,
    getThreadReplies,
    addReply,
    removeReply,
    hasThread,
    getThreadCount,
    clearThread,
  };
}
