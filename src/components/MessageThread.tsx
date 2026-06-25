import { useState } from "react";
import { Check, Edit3, Forward, LoaderCircle, MessageSquare, Trash2, X } from "lucide-react";
import type { ThreadReply } from "../types";
import { timeAgo } from "../app-state";
import { LazyMarkdown } from "./LazyMarkdown";

export function MessageThread({
  messageId,
  replies,
  expanded,
  composing,
  replyContent,
  pendingIds,
  error,
  onToggle,
  onReplyContentChange,
  onCancelReply,
  onAddReply,
  onUpdateReply,
  onRemoveReply,
  onClearThread,
  onForwardReply,
  onNotice,
}: {
  messageId: string;
  replies: ThreadReply[];
  expanded: boolean;
  composing: boolean;
  replyContent: string;
  pendingIds: Set<string>;
  error: string | null;
  onToggle: () => void;
  onReplyContentChange: (content: string) => void;
  onCancelReply: () => void;
  onAddReply: () => Promise<void>;
  onUpdateReply: (id: string, content: string) => Promise<unknown>;
  onRemoveReply: (id: string) => Promise<void>;
  onClearThread: () => Promise<void>;
  onForwardReply: (replyId: string, content: string) => void;
  onNotice: (message: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const parentPending = pendingIds.has(`parent:${messageId}`);

  return (
    <>
      {replies.length > 0 && (
        <div className="thread-indicator">
          <button type="button" className="thread-toggle" onClick={onToggle} aria-expanded={expanded}>
            <MessageSquare size={13} /> {replies.length} 条回复
            <span aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button>
          {expanded && (
            <div className="thread-replies">
              {replies.map((reply) => {
                const pending = pendingIds.has(reply.id);
                const editing = editingId === reply.id;
                return (
                  <article key={reply.id} className="thread-reply">
                    <div className="thread-reply-meta">
                      <span>跟进回复</span>
                      <time dateTime={reply.updatedAt}>
                        {timeAgo(reply.updatedAt)}
                        {reply.updatedAt !== reply.createdAt ? " · 已编辑" : ""}
                      </time>
                    </div>
                    {editing ? (
                      <div className="thread-edit">
                        <textarea
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          maxLength={4000}
                          aria-label="编辑线程回复"
                          autoFocus
                        />
                        <div className="thread-reply-actions">
                          <button type="button" onClick={() => setEditingId(null)} disabled={pending}>
                            <X size={13} /> 取消
                          </button>
                          <button
                            type="button"
                            className="primary-button"
                            disabled={!editingContent.trim() || pending}
                            onClick={async () => {
                              try {
                                await onUpdateReply(reply.id, editingContent.trim());
                                setEditingId(null);
                                onNotice("线程回复已更新。");
                              } catch {
                                // The hook exposes the actionable error beside the thread.
                              }
                            }}
                          >
                            {pending ? <LoaderCircle className="spin" size={13} /> : <Check size={13} />} 保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <LazyMarkdown content={reply.content} />
                    )}
                    {!editing && (
                      <div className="thread-reply-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(reply.id);
                            setEditingContent(reply.content);
                          }}
                          disabled={pending}
                        >
                          <Edit3 size={13} /> 编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => onForwardReply(reply.id, reply.content)}
                          disabled={pending}
                        >
                          <Forward size={13} /> 转发
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={pending}
                          onClick={async () => {
                            try {
                              await onRemoveReply(reply.id);
                              onNotice("线程回复已删除。");
                            } catch {
                              // Error remains visible in the thread.
                            }
                          }}
                        >
                          {pending ? <LoaderCircle className="spin" size={13} /> : <Trash2 size={13} />} 删除
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
              <button
                type="button"
                className={`thread-clear-btn${confirmClear ? " confirming" : ""}`}
                disabled={parentPending}
                onClick={async () => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    return;
                  }
                  try {
                    await onClearThread();
                    setConfirmClear(false);
                    onNotice("线程已清空。");
                  } catch {
                    // Error remains visible in the thread.
                  }
                }}
                onBlur={() => setConfirmClear(false)}
              >
                {parentPending ? <LoaderCircle className="spin" size={13} /> : <Trash2 size={13} />}
                {confirmClear ? "再次点击确认清空" : "清空此线程"}
              </button>
            </div>
          )}
        </div>
      )}

      {composing && (
        <div className="reply-input">
          <div className="reply-input-heading">
            <span>添加跟进回复</span>
            <span>{replyContent.length}/4000</span>
          </div>
          <textarea
            value={replyContent}
            onChange={(event) => onReplyContentChange(event.target.value)}
            placeholder="记录需要跟进的结论、补充说明或行动项..."
            rows={3}
            maxLength={4000}
            autoFocus
          />
          {error && <p className="thread-error" role="alert">{error}</p>}
          <div className="reply-actions">
            <button type="button" className="ghost-button" onClick={onCancelReply} disabled={parentPending}>取消</button>
            <button type="button" className="primary-button" onClick={onAddReply} disabled={!replyContent.trim() || parentPending}>
              {parentPending ? <LoaderCircle className="spin" size={14} /> : <MessageSquare size={14} />} 保存回复
            </button>
          </div>
        </div>
      )}
      {!composing && expanded && error && <p className="thread-error" role="alert">{error}</p>}
    </>
  );
}
