import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:forwardedMessages";

interface ForwardRecord {
  messageId: string;
  content: string;
  forwardedAt: string;
  targetConversation: string;
  targetConversationId?: string;
}

type ForwardedMessages = ForwardRecord[];

function loadForwarded(): ForwardedMessages {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveForwarded(forwarded: ForwardedMessages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forwarded));
}

export function useMessageForwarding() {
  const [forwarded, setForwarded] = useState<ForwardedMessages>(loadForwarded);

  const forwardMessage = useCallback((messageId: string, content: string, targetConversation: string, targetConversationId?: string) => {
    setForwarded((prev) => {
      const updated = [
        ...prev,
        {
          messageId,
          content,
          forwardedAt: new Date().toISOString(),
          targetConversation,
          targetConversationId,
        },
      ];
      saveForwarded(updated);
      return updated;
    });
  }, []);

  const getForwardedMessages = useCallback((): ForwardedMessages => {
    return forwarded;
  }, [forwarded]);

  const getForwardCount = useCallback((messageId: string): number => {
    return forwarded.filter((f) => f.messageId === messageId).length;
  }, [forwarded]);

  return {
    forwardMessage,
    getForwardedMessages,
    getForwardCount,
  };
}
