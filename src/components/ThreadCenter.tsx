import { useId } from "react";
import { LoaderCircle, MessageSquareText } from "lucide-react";
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
        <div className="thread-center-list">
          {threads.map(({ parentMessageId, parent, replies, latest }) => (
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
        </div>
      )}
    </section>
  );
}
