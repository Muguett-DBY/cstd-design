import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

const QUICK_EMOJIS = ["👍", "❤️", "😊", "🎉", "🤔", "👀"];

export function useMessageReactions(conversationId: string | null) {
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!conversationId) {
      loadedRef.current = true;
      return;
    }
    loadedRef.current = false;
    api.reactions(conversationId)
      .then((res) => { setReactions(res.reactions); loadedRef.current = true; })
      .catch(() => { loadedRef.current = true; });
  }, [conversationId]);

  const getReactions = useCallback((messageId: string): string[] => {
    return reactions[messageId] || [];
  }, [reactions]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!conversationId) return;
    const prev = reactions[messageId] || [];
    const hasReaction = prev.includes(emoji);
    setReactions((r) => ({
      ...r,
      [messageId]: hasReaction ? prev.filter((e) => e !== emoji) : [...prev, emoji],
    }));
    try {
      await api.toggleReaction(conversationId, messageId, emoji);
    } catch {
      setReactions((r) => ({
        ...r,
        [messageId]: hasReaction ? [...(r[messageId] || []), emoji] : (r[messageId] || []).filter((e) => e !== emoji),
      }));
    }
  }, [conversationId, reactions]);

  const hasReaction = useCallback((messageId: string, emoji: string): boolean => {
    return (reactions[messageId] || []).includes(emoji);
  }, [reactions]);

  return { getReactions, toggleReaction, hasReaction, quickEmojis: QUICK_EMOJIS };
}
