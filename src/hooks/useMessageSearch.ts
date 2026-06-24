import { useCallback, useMemo, useState } from "react";
import type { ChatMessage, ThreadReply } from "../types";
import { semanticMatch } from "../utils/semanticSearch";

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

function exactMatchSearch(content: string, query: string, messageId: string, role: "user" | "assistant", isThreadReply: boolean, parentId?: string, replyIdx?: number): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerContent = content.toLowerCase();
  let startIndex = 0;

  while (startIndex < lowerContent.length) {
    const matchIndex = lowerContent.indexOf(query, startIndex);
    if (matchIndex === -1) break;

    const matchEnd = matchIndex + query.length;
    const snippetStart = Math.max(0, matchIndex - 20);
    const snippetEnd = Math.min(content.length, matchEnd + 20);
    const prefix = snippetStart > 0 ? "..." : "";
    const suffix = snippetEnd < content.length ? "..." : "";
    const snippet = prefix + content.slice(snippetStart, snippetEnd) + suffix;

    results.push({
      messageId,
      role,
      content,
      matchStart: matchIndex,
      matchEnd,
      snippet,
      isThreadReply,
      parentMessageId: isThreadReply ? parentId : undefined,
      replyIndex: isThreadReply ? replyIdx : undefined,
    });

    startIndex = matchIndex + 1;
  }

  return results;
}

export function useMessageSearch(messages: ChatMessage[], threads: Record<string, ThreadReply[]> = {}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [useSemantic, setUseSemantic] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const cutoff = dateFilterCutoff(dateFilter);
    const found: SearchResult[] = [];

    for (const message of messages) {
      if (message.status === "streaming") continue;
      if (roleFilter !== "all" && message.role !== roleFilter) continue;
      if (cutoff !== null && message.createdAt) {
        if (new Date(message.createdAt).getTime() < cutoff) continue;
      }

      if (useSemantic) {
        if (semanticMatch(message.content, q)) {
          const idx = message.content.toLowerCase().indexOf(q);
          const matchIdx = idx >= 0 ? idx : 0;
          found.push({
            messageId: message.id,
            role: message.role,
            content: message.content,
            matchStart: matchIdx,
            matchEnd: matchIdx + q.length,
            snippet: message.content.slice(0, 80) + (message.content.length > 80 ? "..." : ""),
          });
        }
      } else {
        found.push(...exactMatchSearch(message.content, q, message.id, message.role, false));
      }

      if (!useSemantic) {
        const threadReplies = threads[message.id];
        if (threadReplies?.length) {
          threadReplies.forEach((reply, replyIdx) => {
            found.push(...exactMatchSearch(reply.content, q, message.id, message.role, true, message.id, replyIdx));
          });
        }
      }
    }

    return found;
  }, [query, messages, threads, roleFilter, dateFilter, useSemantic]);

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
    useSemantic,
    setUseSemantic,
  };
}
