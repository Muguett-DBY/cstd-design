import { useCallback, useState } from "react";
import type { ConversationSummary } from "../types";

const STORAGE_KEY = "cstd-design:conversationOrder";

function loadOrder(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOrder(order: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function useConversationOrder() {
  const [order, setOrder] = useState<string[]>(loadOrder);

  const reorder = useCallback((conversations: ConversationSummary[]): ConversationSummary[] => {
    if (order.length === 0) return conversations;

    const byId = new Map(conversations.map((c) => [c.id, c]));
    const result: ConversationSummary[] = [];

    for (const id of order) {
      const conv = byId.get(id);
      if (conv) {
        result.push(conv);
        byId.delete(id);
      }
    }

    for (const conv of byId.values()) {
      result.push(conv);
    }

    return result;
  }, [order]);

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    setOrder((prevOrder) => {
      const conversations = loadOrder();
      const allIds = [...new Set([...prevOrder, sourceId, targetId, ...conversations])];

      const sourceIndex = allIds.indexOf(sourceId);
      const targetIndex = allIds.indexOf(targetId);

      if (sourceIndex === -1 || targetIndex === -1) return prevOrder;

      const newOrder = [...allIds];
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceId);

      saveOrder(newOrder);
      return newOrder;
    });
  }, []);

  return { reorder, onDragStart, onDragOver, onDrop };
}
