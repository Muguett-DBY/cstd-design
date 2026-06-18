import { useCallback, useMemo, useState } from "react";
import type { ChatMessage, ThreadReply } from "../types";

export interface SearchResult {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  matchStart: number;
  matchEnd: number;
  snippet: string;
  isThreadReply?: boolean;
  parentMessageId?: string;
  replyIndex?: number;
}

export function useMessageSearch(messages: ChatMessage[], threads: Record<string, ThreadReply[]> = {}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    // Search through main messages
    for (const message of messages) {
      if (message.status === "streaming") continue;
      const content = message.content;
      const lowerContent = content.toLowerCase();
      let startIndex = 0;

      while (startIndex < lowerContent.length) {
        const matchIndex = lowerContent.indexOf(q, startIndex);
        if (matchIndex === -1) break;

        const matchEnd = matchIndex + query.length;
        const snippetStart = Math.max(0, matchIndex - 20);
        const snippetEnd = Math.min(content.length, matchEnd + 20);
        const prefix = snippetStart > 0 ? "..." : "";
        const suffix = snippetEnd < content.length ? "..." : "";
        const snippet = prefix + content.slice(snippetStart, snippetEnd) + suffix;

        found.push({
          messageId: message.id,
          role: message.role,
          content,
          matchStart: matchIndex,
          matchEnd,
          snippet,
        });

        startIndex = matchIndex + 1;
      }

      // Search through thread replies for this message
      const threadReplies = threads[message.id];
      if (threadReplies?.length) {
        threadReplies.forEach((reply, replyIdx) => {
          const lowerReply = reply.content.toLowerCase();
          let replyStartIndex = 0;

          while (replyStartIndex < lowerReply.length) {
            const matchIndex = lowerReply.indexOf(q, replyStartIndex);
            if (matchIndex === -1) break;

            const matchEnd = matchIndex + query.length;
            const snippetStart = Math.max(0, matchIndex - 20);
            const snippetEnd = Math.min(reply.content.length, matchEnd + 20);
            const prefix = snippetStart > 0 ? "..." : "";
            const suffix = snippetEnd < reply.content.length ? "..." : "";
            const snippet = prefix + reply.content.slice(snippetStart, snippetEnd) + suffix;

            found.push({
              messageId: message.id,
              role: message.role,
              content: reply.content,
              matchStart: matchIndex,
              matchEnd,
              snippet,
              isThreadReply: true,
              parentMessageId: message.id,
              replyIndex: replyIdx,
            });

            replyStartIndex = matchIndex + 1;
          }
        });
      }
    }

    return found;
  }, [query, messages, threads]);

  const totalResults = results.length;

  const goNext = useCallback(() => {
    if (totalResults === 0) return;
    setActiveIndex((prev) => (prev + 1) % totalResults);
  }, [totalResults]);

  const goPrev = useCallback(() => {
    if (totalResults === 0) return;
    setActiveIndex((prev) => (prev - 1 + totalResults) % totalResults);
  }, [totalResults]);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const activeResult = totalResults > 0 ? results[activeIndex] : null;

  return {
    query,
    setQuery,
    results,
    totalResults,
    activeIndex,
    activeResult,
    goNext,
    goPrev,
    isOpen,
    openSearch,
    closeSearch,
  };
}
