import { useCallback, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

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

function isForwardRecord(value: unknown): value is ForwardRecord {
  return isPlainRecord(value)
    && typeof value.messageId === "string"
    && typeof value.content === "string"
    && typeof value.forwardedAt === "string"
    && typeof value.targetConversation === "string"
    && typeof value.targetConversationId === "string";
}

function isForwardedMessages(value: unknown): value is ForwardedMessages {
  return Array.isArray(value) && value.every(isForwardRecord);
}

function loadForwarded(): ForwardedMessages {
  return parseStoredJson(localStorage.getItem(STORAGE_KEY), [], isForwardedMessages);
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
