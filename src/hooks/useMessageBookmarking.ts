import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:bookmarkedMessages";

type BookmarkedMessages = Record<string, boolean>;

function loadBookmarked(): BookmarkedMessages {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveBookmarked(bookmarked: BookmarkedMessages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarked));
}

export function useMessageBookmarking() {
  const [bookmarked, setBookmarked] = useState<BookmarkedMessages>(loadBookmarked);

  const isBookmarked = useCallback((messageId: string): boolean => {
    return bookmarked[messageId] || false;
  }, [bookmarked]);

  const toggleBookmark = useCallback((messageId: string) => {
    setBookmarked((prev) => {
      const updated = { ...prev, [messageId]: !prev[messageId] };
      saveBookmarked(updated);
      return updated;
    });
  }, []);

  const getBookmarkedMessages = useCallback((messageIds: string[]): string[] => {
    return messageIds.filter((id) => bookmarked[id]);
  }, [bookmarked]);

  return {
    isBookmarked,
    toggleBookmark,
    getBookmarkedMessages,
  };
}
