import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import type { ThreadReply } from "../types";

export function useMessageThreading(conversationId: string | null) {
  const [loaded, setLoaded] = useState<{
    conversationId: string | null;
    replies: ThreadReply[];
    error: string | null;
  }>({ conversationId: null, replies: [], error: null });
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const requestVersion = useRef(0);
  const replies = useMemo(
    () => loaded.conversationId === conversationId ? loaded.replies : [],
    [conversationId, loaded],
  );
  const error = loaded.conversationId === conversationId ? loaded.error : null;
  const loading = !!conversationId && loaded.conversationId !== conversationId;

  useEffect(() => {
    const version = ++requestVersion.current;
    if (!conversationId) return;
    api.threadReplies(conversationId)
      .then((result) => {
        if (version === requestVersion.current) {
          setLoaded({ conversationId, replies: result.replies, error: null });
        }
      })
      .catch((reason) => {
        if (version === requestVersion.current) {
          setLoaded({
            conversationId,
            replies: [],
            error: reason instanceof Error ? reason.message : "线程加载失败。",
          });
        }
      });
  }, [conversationId]);

  const markPending = useCallback((id: string, pending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const runMutation = useCallback(async <T,>(key: string, operation: () => Promise<T>) => {
    setLoaded((current) => current.conversationId === conversationId ? { ...current, error: null } : current);
    markPending(key, true);
    try {
      return await operation();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "线程操作失败。";
      setLoaded((current) => current.conversationId === conversationId ? { ...current, error: message } : current);
      throw reason;
    } finally {
      markPending(key, false);
    }
  }, [conversationId, markPending]);

  const addReply = useCallback(async (parentMessageId: string, content: string) => {
    if (!conversationId) return null;
    const result = await runMutation(`parent:${parentMessageId}`, () =>
      api.createThreadReply(conversationId, parentMessageId, content),
    );
    setLoaded((current) => current.conversationId === conversationId
      ? { ...current, replies: [...current.replies, result.reply] }
      : current);
    return result.reply;
  }, [conversationId, runMutation]);

  const updateReply = useCallback(async (id: string, content: string) => {
    const result = await runMutation(id, () => api.updateThreadReply(id, content));
    setLoaded((current) => current.conversationId === conversationId
      ? { ...current, replies: current.replies.map((reply) => reply.id === id ? result.reply : reply) }
      : current);
    return result.reply;
  }, [conversationId, runMutation]);

  const removeReply = useCallback(async (id: string) => {
    await runMutation(id, () => api.deleteThreadReply(id));
    setLoaded((current) => current.conversationId === conversationId
      ? { ...current, replies: current.replies.filter((reply) => reply.id !== id) }
      : current);
  }, [conversationId, runMutation]);

  const clearThread = useCallback(async (parentMessageId: string) => {
    if (!conversationId) return;
    await runMutation(`parent:${parentMessageId}`, () =>
      api.clearMessageThread(conversationId, parentMessageId),
    );
    setLoaded((current) => current.conversationId === conversationId
      ? { ...current, replies: current.replies.filter((reply) => reply.parentMessageId !== parentMessageId) }
      : current);
  }, [conversationId, runMutation]);

  const repliesByParent = useMemo(() => {
    const groups: Record<string, ThreadReply[]> = {};
    for (const reply of replies) {
      (groups[reply.parentMessageId] ||= []).push(reply);
    }
    return groups;
  }, [replies]);

  const getThreadReplies = useCallback(
    (messageId: string) => repliesByParent[messageId] || [],
    [repliesByParent],
  );

  const hasThread = useCallback(
    (messageId: string) => (repliesByParent[messageId]?.length || 0) > 0,
    [repliesByParent],
  );

  const getThreadCount = useCallback(
    (messageId: string) => repliesByParent[messageId]?.length || 0,
    [repliesByParent],
  );

  return {
    replies,
    repliesByParent,
    loading,
    error,
    pendingIds,
    addReply,
    updateReply,
    removeReply,
    clearThread,
    getThreadReplies,
    hasThread,
    getThreadCount,
  };
}
