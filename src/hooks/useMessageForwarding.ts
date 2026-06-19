import { useCallback, useState } from "react";

const STORAGE_KEY = "cstd-design:forwardedMessages";

export interface ForwardRecord {
  messageId: string;
  content: string;
  forwardedAt: string;
  targetConversation: string;
  targetConversationId: string;
  sourceConversationId?: string;
  sourceConversationTitle?: string;
  threadParentId?: string;
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

  const logForward = useCallback((messageId: string, content: string, targetConversation: string, targetConversationId: string, sourceConversationId?: string, sourceConversationTitle?: string, threadParentId?: string) => {
    setForwarded((prev) => {
      const updated = [
        ...prev,
        {
          messageId,
          content,
          forwardedAt: new Date().toISOString(),
          targetConversation,
          targetConversationId,
          sourceConversationId,
          sourceConversationTitle,
          threadParentId,
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

  const removeForward = useCallback((index: number) => {
    setForwarded((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      saveForwarded(updated);
      return updated;
    });
  }, []);

  const getForwardedByTarget = useCallback((targetConversationId: string): ForwardRecord[] => {
    return forwarded.filter((f) => f.targetConversationId === targetConversationId);
  }, [forwarded]);

  return {
    logForward,
    getForwardedMessages,
    getForwardCount,
    removeForward,
    getForwardedByTarget,
  };
}
