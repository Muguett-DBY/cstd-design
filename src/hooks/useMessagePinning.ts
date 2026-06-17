import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:pinnedMessages";

type PinnedMessages = Record<string, boolean>;

function loadPinned(): PinnedMessages {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePinned(pinned: PinnedMessages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned));
}

export function useMessagePinning() {
  const [pinned, setPinned] = useState<PinnedMessages>(loadPinned);

  const isPinned = useCallback((messageId: string): boolean => {
    return pinned[messageId] || false;
  }, [pinned]);

  const togglePin = useCallback((messageId: string) => {
    setPinned((prev) => {
      const updated = { ...prev, [messageId]: !prev[messageId] };
      savePinned(updated);
      return updated;
    });
  }, []);

  const getPinnedMessages = useCallback((messageIds: string[]): string[] => {
    return messageIds.filter((id) => pinned[id]);
  }, [pinned]);

  return { isPinned, togglePin, getPinnedMessages };
}
