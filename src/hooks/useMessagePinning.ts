import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

export function useMessagePinning(conversationId: string | null) {
  const [pinIds, setPinIds] = useState<Map<string, string>>(new Map());
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!conversationId) {
      loadedRef.current = true;
      return;
    }
    loadedRef.current = false;
    api.pins(conversationId)
      .then((res) => {
        const map = new Map<string, string>();
        for (const p of res.pins) map.set(p.messageId, p.id);
        setPinIds(map);
        loadedRef.current = true;
      })
      .catch(() => { loadedRef.current = true; });
  }, [conversationId]);

  const isPinned = useCallback((messageId: string): boolean => {
    return pinIds.has(messageId);
  }, [pinIds]);

  const togglePin = useCallback(async (messageId: string) => {
    if (!conversationId) return;
    const existingId = pinIds.get(messageId);
    if (existingId) {
      setPinIds((prev) => {
        const next = new Map(prev);
        next.delete(messageId);
        return next;
      });
      try {
        await api.removePin(existingId);
      } catch {
        setPinIds((prev) => new Map(prev).set(messageId, existingId));
      }
    } else {
      setPinIds((prev) => new Map(prev).set(messageId, "pending"));
      try {
        const res = await api.addPin(conversationId, messageId);
        setPinIds((prev) => new Map(prev).set(messageId, res.pin.id));
      } catch {
        setPinIds((prev) => {
          const next = new Map(prev);
          next.delete(messageId);
          return next;
        });
      }
    }
  }, [conversationId, pinIds]);

  const getPinnedMessages = useCallback((messageIds: string[]): string[] => {
    return messageIds.filter((id) => pinIds.has(id));
  }, [pinIds]);

  return { isPinned, togglePin, getPinnedMessages };
}
