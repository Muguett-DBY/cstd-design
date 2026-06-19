import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

export function useMessageBookmarking(conversationId: string | null) {
  const [bookmarkIds, setBookmarkIds] = useState<Map<string, string>>(new Map());
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!conversationId) {
      loadedRef.current = true;
      return;
    }
    loadedRef.current = false;
    api.bookmarks(conversationId)
      .then((res) => {
        const map = new Map<string, string>();
        for (const b of res.bookmarks) map.set(b.messageId, b.id);
        setBookmarkIds(map);
        loadedRef.current = true;
      })
      .catch(() => { loadedRef.current = true; });
  }, [conversationId]);

  const isBookmarked = useCallback((messageId: string): boolean => {
    return bookmarkIds.has(messageId);
  }, [bookmarkIds]);

  const toggleBookmark = useCallback(async (messageId: string) => {
    if (!conversationId) return;
    const existingId = bookmarkIds.get(messageId);
    if (existingId) {
      setBookmarkIds((prev) => {
        const next = new Map(prev);
        next.delete(messageId);
        return next;
      });
      try {
        await api.removeBookmark(existingId);
      } catch {
        setBookmarkIds((prev) => new Map(prev).set(messageId, existingId));
      }
    } else {
      setBookmarkIds((prev) => new Map(prev).set(messageId, "pending"));
      try {
        const res = await api.addBookmark(conversationId, messageId);
        setBookmarkIds((prev) => new Map(prev).set(messageId, res.bookmark.id));
      } catch {
        setBookmarkIds((prev) => {
          const next = new Map(prev);
          next.delete(messageId);
          return next;
        });
      }
    }
  }, [conversationId, bookmarkIds]);

  const getBookmarkedMessages = useCallback((messageIds: string[]): string[] => {
    return messageIds.filter((id) => bookmarkIds.has(id));
  }, [bookmarkIds]);

  return {
    isBookmarked,
    toggleBookmark,
    getBookmarkedMessages,
  };
}
