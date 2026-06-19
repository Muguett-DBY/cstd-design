import { useCallback, useMemo, useState } from "react";
import type { ChatMessage, ThreadReply } from "../types";

export type RoleFilter = "all" | "user" | "assistant";
export type DateFilter = "all" | "today" | "week" | "month";

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

function dateFilterCutoff(filter: DateFilter): number | null {
  if (filter === "all") return null;
  const now = Date.now();
  if (filter === "today") return now - 24 * 60 * 60 * 1000;
  if (filter === "week") return now - 7 * 24 * 60 * 60 * 1000;
  if (filter === "month") return now - 30 * 24 * 60 * 60 * 1000;
  return null;
}

export function useMessageSearch(messages: ChatMessage[], threads: Record<string, ThreadReply[]> = {}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const cutoff = dateFilterCutoff(dateFilter);
    const found: SearchResult[] = [];

    // Search through main messages
    for (const message of messages) {
      if (message.status === "streaming") continue;
      if (roleFilter !== "all" && message.role !== roleFilter) continue;
      if (cutoff !== null && message.createdAt) {
        if (new Date(message.createdAt).getTime() < cutoff) continue;
      }
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
  }, [query, messages, threads, roleFilter, dateFilter]);

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
    roleFilter,
    setRoleFilter,
    dateFilter,
    setDateFilter,
  };
}
