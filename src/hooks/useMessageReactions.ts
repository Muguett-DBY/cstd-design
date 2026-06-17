import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:messageReactions";
const QUICK_EMOJIS = ["👍", "❤️", "😊", "🎉", "🤔", "👀"];

type Reactions = Record<string, string[]>;

function loadReactions(): Reactions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveReactions(reactions: Reactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reactions));
}

export function useMessageReactions() {
  const [reactions, setReactions] = useState<Reactions>(loadReactions);

  const getReactions = useCallback((messageId: string): string[] => {
    return reactions[messageId] || [];
  }, [reactions]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setReactions((prev) => {
      const current = prev[messageId] || [];
      const hasReaction = current.includes(emoji);
      const updated = hasReaction
        ? current.filter((e) => e !== emoji)
        : [...current, emoji];
      const next = { ...prev, [messageId]: updated };
      saveReactions(next);
      return next;
    });
  }, []);

  const hasReaction = useCallback((messageId: string, emoji: string): boolean => {
    return (reactions[messageId] || []).includes(emoji);
  }, [reactions]);

  return { getReactions, toggleReaction, hasReaction, quickEmojis: QUICK_EMOJIS };
}
