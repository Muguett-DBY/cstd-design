import { useId, useState } from "react";
import { LoaderCircle, MessageSquareText, Search } from "lucide-react";
import type { ChatMessage, ThreadReply } from "../types";
import { timeAgo } from "../app-state";

export function ThreadCenter({
  messages,
  repliesByParent,
  loading,
  error,
  onOpenThread,
}: {
  messages: ChatMessage[];
  repliesByParent: Record<string, ThreadReply[]>;
  loading: boolean;
  error: string | null;
  onOpenThread: (messageId: string) => void;
}) {
  const headingId = useId();
  const [threadSearch, setThreadSearch] = useState("");
  const messageMap = new Map(messages.map((message) => [message.id, message]));
  const threads = Object.entries(repliesByParent)
    .map(([parentMessageId, replies]) => ({
      parentMessageId,
      parent: messageMap.get(parentMessageId),
      replies,
      latest: replies.reduce((latest, reply) => reply.updatedAt > latest ? reply.updatedAt : latest, ""),
    }))
    .filter((thread) => thread.parent)
    .sort((a, b) => b.latest.localeCompare(a.latest));

  const filteredThreads = threadSearch.trim()
    ? threads.filter((t) => {
        const q = threadSearch.toLowerCase();
        const parentMatch = t.parent?.content.toLowerCase().includes(q);
        const replyMatch = t.replies.some((r) => r.content.toLowerCase().includes(q));
        return parentMatch || replyMatch;
      })
    : threads;

  return (
    <section className="thread-center" aria-labelledby={headingId}>
      <div className="thread-center-heading">
        <span id={headingId}><MessageSquareText size={14} /> 线程中心</span>
        <strong>{threads.length}</strong>
      </div>
      {loading ? (
        <div className="thread-center-state"><LoaderCircle className="spin" size={15} /> 正在同步线程...</div>
      ) : error && threads.length === 0 ? (
        <div className="thread-center-state error">{error}</div>
      ) : threads.length === 0 ? (
        <div className="thread-center-empty">回复任意消息后，线程会集中显示在这里。</div>
      ) : (
        <>
          <div className="thread-center-search">
            <Search size={12} />
            <input
              type="text"
              placeholder="搜索线程..."
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
            />
          </div>
          <div className="thread-center-list">
            {filteredThreads.map(({ parentMessageId, parent, replies, latest }) => (
              <button
                key={parentMessageId}
                type="button"
                className="thread-center-item"
                onClick={() => onOpenThread(parentMessageId)}
              >
                <span className="thread-center-parent">
                  {parent?.role === "assistant" ? "助手" : "你"} · {parent?.content.slice(0, 46) || "空消息"}
                </span>
                <span className="thread-center-summary">
                  <strong>{replies.length} 条回复</strong>
                  <time dateTime={latest}>{timeAgo(latest)}</time>
                </span>
                <span className="thread-center-latest">{replies[replies.length - 1]?.content.slice(0, 64)}</span>
              </button>
            ))}
            {filteredThreads.length === 0 && threadSearch && (
              <div className="thread-center-empty">无匹配线程</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
