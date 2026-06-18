import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Bookmark, Check, Copy, Download, Edit3, Forward, MessageSquare, PanelRight, Pin, Plus, RefreshCw, RotateCcw, Search, Send, Square, Trash2 } from "lucide-react";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import type { ChatMessage, ChatStreamEvent, ConversationDetail } from "../types";
import { initialChatDraft, messageDateLabel, timeAgo } from "../app-state";
import { streamChat } from "../api";
import { ConversationTitleInput } from "./ConversationTitleInput";
import { Markdown } from "./Markdown";
import { ClearAllButton } from "./ClearAllButton";
import { InfoLine } from "./InfoLine";
import { EmptyState } from "./EmptyState";
import { ScrollToBottom } from "./ScrollToBottom";
import { MessageSearchBar } from "./MessageSearchBar";
import { ExportModal } from "./ExportModal";
import { useMessageSearch } from "../hooks/useMessageSearch";
import { useMessageReactions } from "../hooks/useMessageReactions";
import { useMessagePinning } from "../hooks/useMessagePinning";
import { useMessageThreading } from "../hooks/useMessageThreading";
import { useMessageEditing } from "../hooks/useMessageEditing";
import { useMessageBookmarking } from "../hooks/useMessageBookmarking";
import { useMessageForwarding } from "../hooks/useMessageForwarding";
import { ReactionPicker } from "./ReactionPicker";

const ASSISTANT_NAME = "助手";

function CopyButton({ content, onNotice }: { content: string; onNotice: (msg: string) => void }) {
  const [copied, setCopied] = useState(false);
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onNotice("已复制到剪贴板。");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onNotice("复制失败，请重试。");
    }
  };
  return (
    <button type="button" onClick={handleClick} className={copied ? "copied" : ""}>
      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "已复制" : "复制"}
    </button>
  );
}

function DateSeparator({ date }: { date: string }) {
  return <div className="date-separator"><span>{messageDateLabel(date)}</span></div>;
}

function messageRows(messages: ChatMessage[]) {
  const rows: ({ type: "date"; date: string } | { type: "message"; message: ChatMessage })[] = [];
  let lastDate = "";
  for (const message of messages) {
    const date = message.createdAt ? new Date(message.createdAt).toDateString() : "";
    if (date && date !== lastDate) {
      rows.push({ type: "date", date: message.createdAt! });
      lastDate = date;
    }
    rows.push({ type: "message", message });
  }
  return rows;
}

export function ChatWorkspace({
  conversation,
  messages,
  leaves,
  loading,
  onCreate,
  onRename,
  onDelete,
  onBranch,
  onStreamEvent,
  afterSend,
  onClearAll,
  onNotice,
}: {
  conversation: ConversationDetail | null;
  messages: ChatMessage[];
  leaves: ChatMessage[];
  loading: boolean;
  onCreate: () => Promise<void>;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onBranch: (leafId: string) => Promise<void>;
  onStreamEvent: (event: ChatStreamEvent, pendingContent: string) => void;
  afterSend: (conversationId: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [draft, setDraft] = useState(initialChatDraft());
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingAssistantRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const { getReactions, toggleReaction, hasReaction, quickEmojis } = useMessageReactions();
  const { isPinned, togglePin, getPinnedMessages } = useMessagePinning();
  const { threads, getThreadReplies, addReply, removeReply, hasThread, getThreadCount, clearThread } = useMessageThreading();
  const { getEditedContent, editMessage, isEdited, getEditCount } = useMessageEditing();
  const { isBookmarked, toggleBookmark, getBookmarkedMessages } = useMessageBookmarking();
  const { forwardMessage, getForwardedMessages } = useMessageForwarding();
  const search = useMessageSearch(messages, threads);
  const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = window.innerHeight * 0.4;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [draft.content]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setUserScrolledUp(!atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    setUserScrolledUp(false);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll to bottom when streaming and user hasn't scrolled up
  useEffect(() => {
    if (!streaming || userScrolledUp) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, streaming, userScrolledUp]);

  // Keyboard shortcut: Ctrl+F to open search
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        search.openSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [search, search.openSearch]);

  // Scroll to active search result
  useEffect(() => {
    if (!search.activeResult) return;
    const el = messageRefs.current.get(search.activeResult.messageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [search.activeResult]);

  const sendContent = async (content: string, parentId: string | null) => {
    if (!content || streaming) return;
    setStreaming(true);
    setDraft(initialChatDraft());
    const abort = new AbortController();
    abortRef.current = abort;
    let conversationId = conversation?.id;
    let queuedDelta = "";
    let frame: number | null = null;
    const flushQueuedDelta = () => {
      frame = null;
      if (!queuedDelta) return;
      const assistantMessageId = pendingAssistantRef.current;
      if (!assistantMessageId) {
        queuedDelta = "";
        return;
      }
      onStreamEvent({ type: "delta", assistantMessageId, content: queuedDelta }, content);
      queuedDelta = "";
    };
    const flushQueuedDeltaNow = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      flushQueuedDelta();
    };
    try {
      await streamChat(
        { conversationId, parentId, content },
        {
          signal: abort.signal,
          onEvent: (event) => {
            if (event.type === "meta") {
              conversationId = event.conversationId;
              pendingAssistantRef.current = event.assistantMessageId;
              onStreamEvent(event, content);
              return;
            }
            if (event.type === "delta") {
              pendingAssistantRef.current = event.assistantMessageId || pendingAssistantRef.current;
              queuedDelta += event.content;
              if (frame === null) frame = window.requestAnimationFrame(flushQueuedDelta);
              return;
            }
            flushQueuedDeltaNow();
            onStreamEvent({ ...event, assistantMessageId: event.assistantMessageId || pendingAssistantRef.current || "" }, content);
          },
        },
      );
      flushQueuedDeltaNow();
      if (conversationId) await afterSend(conversationId);
      textareaRef.current?.focus();
    } catch (error) {
      flushQueuedDeltaNow();
      textareaRef.current?.focus();
      if (pendingAssistantRef.current) {
        onStreamEvent({ type: "error", assistantMessageId: pendingAssistantRef.current, error: abort.signal.aborted ? "已停止" : "网络异常，请稍后重试。" }, content);
      } else {
        onNotice(error instanceof Error ? error.message : "咨询失败，请稍后重试。");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      pendingAssistantRef.current = null;
    }
  };

  const send = async () => {
    await sendContent(draft.content.trim(), draft.selectedParentId ?? conversation?.activeLeafId ?? null);
  };

  const regenerate = async (assistantMessage: ChatMessage) => {
    const parentUser = messages.find((message) => message.id === assistantMessage.parentId && message.role === "user");
    if (!parentUser) return;
    await sendContent(parentUser.content, parentUser.parentId || null);
  };

  const copyAllAsText = async () => {
    if (!conversation) return;
    const title = conversation.title;
    const body = messages
      .filter((m) => m.status !== "streaming")
      .map((m) => {
        const role = m.role === "user" ? "你" : ASSISTANT_NAME;
        return `${role}：\n${m.content}`;
      })
      .join("\n\n");
    const text = `${title}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotice("对话已复制到剪贴板。");
    } catch {
      onNotice("复制失败，请重试。");
    }
  };

  return (
    <section className="chat-layout">
      <div className="chat-main">
        <div className="chat-title-row">
          <ConversationTitleInput
            key={conversation?.id || "new"}
            title={conversation?.title || "新会话"}
            disabled={!conversation}
            onCommit={async (title) => {
              if (!conversation || title === conversation.title) return;
              await onRename(title);
            }}
          />
          <div className="row-actions">
            <button type="button" className="ghost-button" onClick={onCreate}>
              <Plus size={16} /> 新建
            </button>
            <button type="button" className="ghost-button" onClick={search.openSearch} disabled={!conversation || messages.length === 0} title="搜索消息 (Ctrl+F)">
              <Search size={16} /> 搜索
            </button>
            <button type="button" className="ghost-button" onClick={copyAllAsText} disabled={!conversation || messages.length === 0} title="复制全部对话">
              <Copy size={16} /> 复制全部
            </button>
            <button type="button" className="ghost-button" onClick={() => setShowExportModal(true)} disabled={!conversation || messages.length === 0}>
              <Download size={16} /> 导出
            </button>
            <button type="button" className="ghost-button danger" onClick={onDelete} disabled={!conversation}>
              <Trash2 size={16} /> 删除
            </button>
            <ClearAllButton label="清空全部" onClear={onClearAll} />
          </div>        </div>

        {search.isOpen && (
          <MessageSearchBar
            query={search.query}
            onQueryChange={search.setQuery}
            totalResults={search.totalResults}
            activeIndex={search.activeIndex}
            onNext={search.goNext}
            onPrev={search.goPrev}
            onClose={search.closeSearch}
            threadResults={search.results.filter((r) => r.isThreadReply).length}
          />
        )}

        <div className="messages" ref={messagesContainerRef} onScroll={handleScroll}>
          {loading ? (
            <div className="messages-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`message-skeleton ${i % 2 === 0 ? "user" : "assistant"}`}>
                  <div className="skeleton-avatar" />
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-line-short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-line-medium" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <EmptyState title="可以开始问了" text="这里只保留你的私人会话，不显示内部服务信息。">
              <button type="button" className="primary-button" onClick={onCreate} style={{ marginTop: 8 }}>
                <Plus size={16} /> 新建会话
              </button>
            </EmptyState>
          ) : (
            messageRows(messages).map((row) =>
              row.type === "date" ? (
                <DateSeparator key={row.date} date={row.date} />
              ) : (
              <div
                key={row.message.id}
                ref={(el) => { messageRefs.current.set(row.message.id, el); }}
                className={search.activeResult?.messageId === row.message.id ? "search-active-message" : undefined}
              >
              <article className={`message ${row.message.role}`}>
                <div className="avatar">{row.message.role === "assistant" ? <img src="/brand/mascot.png" alt="" /> : <Bot size={18} />}</div>
                <div className="message-body">
                  <div className="message-meta">
                    <span>{row.message.role === "assistant" ? ASSISTANT_NAME : "你"}</span>
                    <span className="message-time">{row.message.createdAt ? timeAgo(row.message.createdAt) : ""}</span>
                    {row.message.status === "streaming" && <em>正在生成...</em>}
                    {row.message.status === "interrupted" && <em>已中断</em>}
                  </div>
                  <Markdown content={getEditedContent(row.message.id) || row.message.content || "正在思考..."} highlightQuery={search.query} />
                  <div className="message-reactions">
                    {getReactions(row.message.id).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`reaction-badge${hasReaction(row.message.id, emoji) ? " active" : ""}`}
                        onClick={() => toggleReaction(row.message.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                    <ReactionPicker quickEmojis={quickEmojis} onReact={(emoji) => toggleReaction(row.message.id, emoji)} />
                  </div>
                  <div className="message-actions">
                    <CopyButton content={row.message.content} onNotice={onNotice} />
                    <button type="button" onClick={() => {
                      setReplyingTo(replyingTo === row.message.id ? null : row.message.id);
                      setReplyContent("");
                    }} className={replyingTo === row.message.id ? "active" : ""} title="回复消息">
                      <MessageSquare size={14} /> 回复
                    </button>
                    <button type="button" onClick={() => togglePin(row.message.id)} className={isPinned(row.message.id) ? "pinned" : ""} title={isPinned(row.message.id) ? "取消置顶" : "置顶消息"}>
                      <Pin size={14} /> {isPinned(row.message.id) ? "已置顶" : "置顶"}
                    </button>
                    <button type="button" onClick={() => toggleBookmark(row.message.id)} className={isBookmarked(row.message.id) ? "bookmarked" : ""} title={isBookmarked(row.message.id) ? "取消书签" : "添加书签"}>
                      <Bookmark size={14} /> {isBookmarked(row.message.id) ? "已书签" : "书签"}
                    </button>
                    <button type="button" onClick={() => {
                      // For now, use prompt() as a simple solution
                      // In a real implementation, this would open a conversation picker modal
                      const target = prompt("输入目标会话名称：");
                      if (target) {
                        forwardMessage(row.message.id, row.message.content, target);
                        onNotice(`消息已转发到"${target}"`);
                      }
                    }} title="转发消息">
                      <Forward size={14} /> 转发
                    </button>
                    {row.message.role === "user" && editingMessage !== row.message.id && (
                      <button type="button" onClick={() => {
                        setEditingMessage(row.message.id);
                        setEditContent(getEditedContent(row.message.id) || row.message.content);
                      }}>
                        <Edit3 size={14} /> 编辑
                      </button>
                    )}
                    {isEdited(row.message.id) && (
                      <span className="edited-indicator" title={`已编辑 ${getEditCount(row.message.id)} 次`}>
                        (已编辑)
                      </span>
                    )}
                    {row.message.role === "user" && (
                      <button type="button" onClick={() => setDraft({ content: row.message.content, selectedParentId: row.message.parentId || null })}>
                        <Edit3 size={14} /> 编辑后发送
                      </button>
                    )}
                    {row.message.role === "assistant" && (
                      <button type="button" onClick={() => regenerate(row.message)} disabled={streaming}>
                        <RefreshCw size={14} /> 重新生成
                      </button>
                    )}
                    {row.message.role === "assistant" && row.message.status === "interrupted" && (
                      <button type="button" className="retry-button" onClick={() => regenerate(row.message)} disabled={streaming}>
                        <RotateCcw size={14} /> 重试
                      </button>
                    )}
                  </div>
                  {editingMessage === row.message.id && (
                    <div className="message-edit-input">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="编辑消息内容..."
                        rows={3}
                      />
                      <div className="edit-actions">
                        <button type="button" className="ghost-button" onClick={() => setEditingMessage(null)}>取消</button>
                        <button type="button" className="primary-button" onClick={() => {
                          if (editContent.trim()) {
                            editMessage(row.message.id, row.message.content, editContent.trim());
                            setEditingMessage(null);
                            onNotice("消息已编辑。");
                          }
                        }} disabled={!editContent.trim()}>保存</button>
                      </div>
                    </div>
                  )}
                  {hasThread(row.message.id) && (
                    <div className="thread-indicator">
                      <button type="button" className="thread-toggle" onClick={() => {
                        const newExpanded = new Set(expandedThreads);
                        if (newExpanded.has(row.message.id)) {
                          newExpanded.delete(row.message.id);
                        } else {
                          newExpanded.add(row.message.id);
                        }
                        setExpandedThreads(newExpanded);
                      }}>
                        <MessageSquare size={12} /> {getThreadCount(row.message.id)} 条回复
                        {expandedThreads.has(row.message.id) ? " ▼" : " ▶"}
                      </button>
                      {expandedThreads.has(row.message.id) && (
                        <div className="thread-replies">
                          {getThreadReplies(row.message.id).map((reply, idx) => (
                            <div key={idx} className="thread-reply">
                              <span className="thread-reply-label">回复：</span>
                              <Markdown content={reply} />
                              <button type="button" className="thread-reply-delete" onClick={() => {
                                // Remove reply by index
                                const replies = getThreadReplies(row.message.id);
                                if (replies.length > 0) {
                                  // We need to use the removeReply function
                                  // For now, we'll just remove by index
                                  removeReply(row.message.id, idx);
                                }
                              }}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                          <button type="button" className="thread-clear-btn" onClick={() => {
                            clearThread(row.message.id);
                          }}>
                            清空线程
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {replyingTo === row.message.id && (
                    <div className="reply-input">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="输入回复内容..."
                        rows={2}
                      />
                      <div className="reply-actions">
                        <button type="button" className="ghost-button" onClick={() => setReplyingTo(null)}>取消</button>
                        <button type="button" className="primary-button" onClick={() => {
                          if (replyContent.trim()) {
                            addReply(row.message.id, replyContent.trim());
                            setReplyContent("");
                            setReplyingTo(null);
                            // Auto-expand the thread
                            const newExpanded = new Set(expandedThreads);
                            newExpanded.add(row.message.id);
                            setExpandedThreads(newExpanded);
                          }
                        }} disabled={!replyContent.trim()}>发送回复</button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
              </div>
              )
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        <ScrollToBottom visible={userScrolledUp} onClick={scrollToBottom} />

        <div className="composer">
          {draft.selectedParentId !== null && <div className="draft-note">正在从旧问题处分支。发送后会保留原分支。</div>}
          <textarea
            ref={textareaRef}
            value={draft.content}
            maxLength={8000}
            onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="输入你的问题...（Shift + Enter 换行）"
            aria-label="输入消息"
          />
          <div className="composer-actions">
            <span className="char-count">{draft.content.length}/8000</span>
            <button type="button" className="ghost-button" onClick={() => setDraft(initialChatDraft())}>
              清空
            </button>
            <button type="button" className="ghost-button" onClick={() => setPanelOpen((p) => !p)} title={panelOpen ? "收起信息面板" : "展开信息面板"}>
              <PanelRight size={16} />
            </button>
            {streaming ? (
              <button type="button" className="primary-button muted" onClick={() => abortRef.current?.abort()}>
                <Square size={16} /> 停止回答
              </button>
            ) : (
              <button type="button" className="primary-button" onClick={send} disabled={!draft.content.trim()}>
                <Send size={16} /> 发送
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className={`right-panel${panelOpen ? "" : " right-panel-collapsed"}`}>
        <h3>会话信息</h3>
        <InfoLine label="消息数" value={String(conversation?.messages.length || 0)} />
        <InfoLine label="分支数" value={String(leaves.length || 0)} />
        <InfoLine label="线程数" value={String(Object.keys(threads).filter((id) => threads[id].replies.length > 0).length)} />
        <InfoLine label="置顶数" value={String(getPinnedMessages(messages.map((m) => m.id)).length)} />
        {getPinnedMessages(messages.map((m) => m.id)).length > 0 && (
          <div className="pinned-section">
            <span className="pinned-header"><Pin size={12} /> 置顶消息</span>
            <div className="pinned-list">
              {getPinnedMessages(messages.map((m) => m.id)).map((id) => {
                const msg = messages.find((m) => m.id === id);
                if (!msg) return null;
                return (
                  <button key={id} type="button" className="pinned-item" onClick={() => {
                    const el = messageRefs.current.get(id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}>
                    {msg.content.slice(0, 50)}{msg.content.length > 50 ? "..." : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {getBookmarkedMessages(messages.map((m) => m.id)).length > 0 && (
          <div className="pinned-section">
            <span className="pinned-header"><Bookmark size={12} /> 书签消息</span>
            <div className="pinned-list">
              {getBookmarkedMessages(messages.map((m) => m.id)).map((id) => {
                const msg = messages.find((m) => m.id === id);
                if (!msg) return null;
                return (
                  <button key={id} type="button" className="pinned-item" onClick={() => {
                    const el = messageRefs.current.get(id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}>
                    {msg.content.slice(0, 50)}{msg.content.length > 50 ? "..." : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {getForwardedMessages().length > 0 && (
          <div className="pinned-section">
            <span className="pinned-header"><Forward size={12} /> 转发记录</span>
            <div className="pinned-list">
              {getForwardedMessages().slice(-5).map((f, idx) => (
                <div key={idx} className="pinned-item">
                  <span className="forward-target">→ {f.targetConversation}</span>
                  {f.content.slice(0, 40)}{f.content.length > 40 ? "..." : ""}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="branch-list">
          <span>可切换分支</span>
          {leaves.length === 0 ? <p>暂无分支</p> : leaves.map((leaf) => (
            <button key={leaf.id} type="button" onClick={() => onBranch(leaf.id)} className={leaf.id === conversation?.activeLeafId ? "active" : ""}>
              {leaf.content.slice(0, 24) || "空回答"}
            </button>
          ))}
        </div>
        <img src="/brand/mascot.png" alt="" className="panel-mascot" />
      </aside>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={conversation?.title || "新会话"}
        messages={messages}
      />
    </section>
  );
}
