import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Bot, Bookmark, Check, CheckSquare, Copy, Download, Edit, Edit3, FileText, Forward, MessageSquare, PanelRight, Pin, Plus, RefreshCw, RotateCcw, Save, Search, Send, Square, Trash2, X } from "lucide-react";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import type { AssetItem, ChatMessage, ChatStreamEvent, ConversationDetail, ConversationSummary } from "../types";
import { messageDateLabel, timeAgo } from "../app-state";
import { streamChat } from "../api";
import { ConversationTitleInput } from "./ConversationTitleInput";
import { Markdown } from "./Markdown";
import { ClearAllButton } from "./ClearAllButton";
import { InfoLine } from "./InfoLine";
import { EmptyState } from "./EmptyState";
import { ScrollToBottom } from "./ScrollToBottom";
import { MessageSearchBar } from "./MessageSearchBar";
import { useMessageSearch } from "../hooks/useMessageSearch";
import { useSavedSearches } from "../hooks/useSavedSearches";
import { useMessageReactions } from "../hooks/useMessageReactions";
import { useMessagePinning } from "../hooks/useMessagePinning";
import { useMessageThreading } from "../hooks/useMessageThreading";
import { useMessageEditing } from "../hooks/useMessageEditing";
import { useMessageBookmarking } from "../hooks/useMessageBookmarking";
import { useMessageForwarding } from "../hooks/useMessageForwarding";
import { useChatPromptTemplates, expandVariables } from "../hooks/useChatPromptTemplates";
import { usePromptHistory, usePromptSuggestions } from "../hooks/usePromptHistory";
import { useDraftPersistence } from "../hooks/useDraftPersistence";
import { enhancePrompt } from "../hooks/usePromptEnhance";
import { ReactionPicker } from "./ReactionPicker";
import { MessageThread } from "./MessageThread";
import { ThreadCenter } from "./ThreadCenter";
import { ConversationPickerModal } from "./ConversationPickerModal";
const StatsPanel = lazy(() => import("./StatsPanel").then((m) => ({ default: m.StatsPanel })));
const ExportModal = lazy(() => import("./ExportModal").then((m) => ({ default: m.ExportModal })));
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
const PdfExportButton = lazy(() => import("./PdfExportButton").then((m) => ({ default: m.PdfExportButton })));
import { PromptSuggestions } from "./PromptSuggestions";
import { VoiceInputButton } from "./VoiceInputButton";

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
  allConversations = [],
  allAssets = [],
  onRecordUsage,
  usageStats,
  usageEvents,
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
  allConversations?: ConversationSummary[];
  allAssets?: AssetItem[];
  onRecordUsage?: (type: "message_sent" | "image_generated" | "video_generated" | "image_edited" | "video_abandoned") => void;
  usageStats?: { messageSent: number; imageGenerated: number; videoGenerated: number; imageEdited: number; videoAbandoned: number };
  usageEvents?: { type: "message_sent" | "image_generated" | "video_generated" | "image_edited" | "video_abandoned"; timestamp: string }[];
}) {
  const { draft, setDraft, clearDraft } = useDraftPersistence(conversation?.id || null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pendingAssistantRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const { history: promptHistory, recordPrompt } = usePromptHistory();
  const promptSuggestions = usePromptSuggestions(draft.content, promptHistory, 3);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { templates, save, remove } = useChatPromptTemplates();
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const lastBulkIndexRef = useRef<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const { getReactions, toggleReaction, hasReaction, quickEmojis } = useMessageReactions(conversation?.id || null);
  const { isPinned, togglePin, getPinnedMessages } = useMessagePinning(conversation?.id || null);
  const {
    repliesByParent,
    loading: threadsLoading,
    error: threadError,
    pendingIds: threadPendingIds,
    addReply,
    updateReply,
    removeReply,
    clearThread,
    getThreadReplies,
  } = useMessageThreading(conversation?.id || null);
  const { getEditedContent, editMessage, isEdited, getEditCount } = useMessageEditing(conversation?.id || null);
  const { isBookmarked, toggleBookmark, getBookmarkedMessages } = useMessageBookmarking(conversation?.id || null);
  const { logForward, getForwardedMessages, getForwardCount } = useMessageForwarding();
  const search = useMessageSearch(messages, repliesByParent);
  const savedSearches = useSavedSearches();
  const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pendingForward, setPendingForward] = useState<{ messageId: string; content: string; threadParentId?: string } | null>(null);

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
    const result = search.activeResult;
    const frame = window.requestAnimationFrame(() => {
      if (result.isThreadReply) {
        setExpandedThreads((current) => new Set(current).add(result.messageId));
      }
      messageRefs.current.get(result.messageId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [search.activeResult]);

  const sendContent = async (content: string, parentId: string | null) => {
    if (!content || streaming) return;
    onRecordUsage?.("message_sent");
    recordPrompt(content);
    setStreaming(true);
    clearDraft();
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

  const quickExportMarkdown = () => {
    if (!conversation) return;
    const title = conversation.title;
    const date = new Date().toISOString().slice(0, 10);
    const safeTitle = (title || "对话").replace(/[\\/:*?"<>|]/g, "_").slice(0, 64);
    const body = messages
      .filter((m) => m.status !== "streaming")
      .map((m) => {
        const role = m.role === "user" ? "**你**" : `**${ASSISTANT_NAME}**`;
        const timestamp = m.createdAt ? `\n\n<sub>${new Date(m.createdAt).toLocaleString("zh-CN")}</sub>` : "";
        return `${role}：${timestamp}\n\n${m.content}`;
      })
      .join("\n\n---\n\n");
    const text = `# ${title}\n\n*导出于 ${date}*\n\n${body}\n`;
    try {
      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeTitle}-${date}.md`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onNotice("已导出为 Markdown 文件。");
    } catch {
      onNotice("导出失败，请重试。");
    }
  };

  const toggleBulk = (messageId: string, index: number, shiftKey: boolean) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastBulkIndexRef.current !== null) {
        const [start, end] = lastBulkIndexRef.current < index
          ? [lastBulkIndexRef.current, index]
          : [index, lastBulkIndexRef.current];
        for (let i = start; i <= end; i++) {
          const m = messages[i];
          if (m) next.add(m.id);
        }
      } else if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
    lastBulkIndexRef.current = index;
  };

  const selectAllMessages = () => {
    setBulkSelected(new Set(messages.filter((m) => m.status !== "streaming").map((m) => m.id)));
  };

  const clearBulkSelection = () => {
    setBulkSelected(new Set());
    lastBulkIndexRef.current = null;
  };

  const copySelectedMessages = async () => {
    const selectedMessages = messages
      .filter((m) => bulkSelected.has(m.id) && m.status !== "streaming")
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    if (selectedMessages.length === 0) return;
    const body = selectedMessages
      .map((m) => {
        const role = m.role === "user" ? "你" : ASSISTANT_NAME;
        return `${role}：\n${m.content}`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(body);
      onNotice(`已复制 ${selectedMessages.length} 条消息。`);
    } catch {
      onNotice("复制失败，请重试。");
    }
  };

  const bookmarkSelectedMessages = async () => {
    if (!conversation) return;
    const selectedMessages = messages.filter((m) => bulkSelected.has(m.id));
    let successCount = 0;
    for (const m of selectedMessages) {
      try {
        await toggleBookmark(m.id);
        successCount++;
      } catch {
        // skip individual failures
      }
    }
    onNotice(`已收藏 ${successCount} 条消息。`);
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    clearBulkSelection();
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
            <button
              type="button"
              className={`ghost-button${bulkMode ? " active" : ""}`}
              onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)}
              disabled={!conversation || messages.length === 0}
              title="批量选择消息"
              aria-pressed={bulkMode}
            >
              {bulkMode ? <CheckSquare size={16} /> : <Square size={16} />} {bulkMode ? "退出选择" : "多选"}
            </button>
            <button type="button" className="ghost-button" onClick={copyAllAsText} disabled={!conversation || messages.length === 0} title="复制全部对话">
              <Copy size={16} /> 复制全部
            </button>
            <button type="button" className="ghost-button" onClick={quickExportMarkdown} disabled={!conversation || messages.length === 0} title="快速导出为 Markdown 文件">
              <Download size={16} /> 快速导出
            </button>
            <Suspense fallback={<button type="button" className="ghost-button" disabled><Download size={16} /> PDF</button>}>
              <PdfExportButton
                title={conversation?.title || "conversation"}
                messages={messages
                  .filter((m) => m.status !== "streaming")
                  .map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }))}
                onNotice={onNotice}
              />
            </Suspense>
            <button type="button" className="ghost-button" onClick={() => setShowExportModal(true)} disabled={!conversation || messages.length === 0}>
              <FileText size={16} /> 高级导出
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
            roleFilter={search.roleFilter}
            dateFilter={search.dateFilter}
            onRoleFilterChange={search.setRoleFilter}
            onDateFilterChange={search.setDateFilter}
            useSemantic={search.useSemantic}
            onUseSemanticChange={search.setUseSemantic}
            onSaveSearch={() => {
              const name = search.query.trim().slice(0, 20);
              savedSearches.add({
                name,
                query: search.query,
                roleFilter: search.roleFilter,
                dateFilter: search.dateFilter,
              });
              onNotice(`已保存搜索"${name}"。`);
            }}
            savedSearches={savedSearches.saved}
            onApplySavedSearch={(s) => {
              search.setQuery(s.query);
              search.setRoleFilter(s.roleFilter);
              search.setDateFilter(s.dateFilter);
            }}
            onDeleteSavedSearch={savedSearches.remove}
          />
        )}

        <div className="mobile-thread-center">
          <ThreadCenter
            messages={messages}
            repliesByParent={repliesByParent}
            loading={threadsLoading}
            error={threadError}
            onOpenThread={(messageId) => {
              setExpandedThreads((current) => new Set(current).add(messageId));
              window.requestAnimationFrame(() => {
                messageRefs.current.get(messageId)?.scrollIntoView({ behavior: "smooth", block: "center" });
              });
            }}
          />
        </div>

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
              <article
                className={`message ${row.message.role}${bulkMode ? " bulk-mode" : ""}${bulkSelected.has(row.message.id) ? " bulk-selected" : ""}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const items: ContextMenuItem[] = [
                    {
                      id: "copy",
                      label: "复制",
                      icon: Copy,
                      onClick: () => { void navigator.clipboard.writeText(row.message.content || ""); onNotice("已复制。"); },
                    },
                    { id: "sep1", label: "", icon: Copy, onClick: () => {}, separator: true },
                    {
                      id: "edit",
                      label: "编辑",
                      icon: Edit,
                      onClick: () => { setEditingMessage(row.message.id); setEditContent(getEditedContent(row.message.id) || row.message.content); },
                    },
                    {
                      id: "thread",
                      label: "在新线程中回复",
                      icon: MessageSquare,
                      onClick: () => { setReplyingTo(row.message.id); setReplyContent(""); },
                    },
                    {
                      id: "pin",
                      label: isPinned(row.message.id) ? "取消置顶" : "置顶",
                      icon: Pin,
                      onClick: () => { void togglePin(row.message.id); },
                    },
                    {
                      id: "bookmark",
                      label: isBookmarked(row.message.id) ? "取消书签" : "书签",
                      icon: Bookmark,
                      onClick: () => { void toggleBookmark(row.message.id); },
                    },
                  ];
                  if (row.message.role === "user") {
                    items.push({ id: "sep2", label: "", icon: Trash2, onClick: () => {}, separator: true });
                    items.push({
                      id: "copy-text",
                      label: "复制消息 ID",
                      icon: Copy,
                      onClick: () => { void navigator.clipboard.writeText(row.message.id); onNotice("已复制消息 ID。"); },
                    });
                  }
                  setContextMenu({ x: e.clientX, y: e.clientY, items });
                }}
              >
                {bulkMode && row.message.status !== "streaming" && (
                  <label
                    className="message-bulk-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelected.has(row.message.id)}
                      onChange={(e) => toggleBulk(row.message.id, messages.findIndex((m) => m.id === row.message.id), (e.nativeEvent as MouseEvent).shiftKey)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`选择消息 ${row.message.id}`}
                    />
                  </label>
                )}
                <div className="avatar">{row.message.role === "assistant" ? <img src="/brand/mascot.png" alt="" /> : <Bot size={18} />}</div>
                <div className="message-body">
                  <div className="message-meta">
                    <span>{row.message.role === "assistant" ? ASSISTANT_NAME : "你"}</span>
                    <span className="message-time">{row.message.createdAt ? timeAgo(row.message.createdAt) : ""}</span>
                    {getForwardCount(row.message.id) > 0 && (
                      <span className="forwarded-badge" title={`已转发 ${getForwardCount(row.message.id)} 次`}>
                        <Forward size={10} /> 已转发
                      </span>
                    )}
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
                      setPendingForward({ messageId: row.message.id, content: row.message.content });
                      setShowPicker(true);
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
                  <MessageThread
                    messageId={row.message.id}
                    replies={getThreadReplies(row.message.id)}
                    expanded={expandedThreads.has(row.message.id)}
                    composing={replyingTo === row.message.id}
                    replyContent={replyContent}
                    pendingIds={threadPendingIds}
                    error={threadError}
                    onToggle={() => {
                      setExpandedThreads((current) => {
                        const next = new Set(current);
                        if (next.has(row.message.id)) next.delete(row.message.id);
                        else next.add(row.message.id);
                        return next;
                      });
                    }}
                    onReplyContentChange={setReplyContent}
                    onCancelReply={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                    onAddReply={async () => {
                      if (!replyContent.trim()) return;
                      try {
                        await addReply(row.message.id, replyContent.trim());
                        setReplyContent("");
                        setReplyingTo(null);
                        setExpandedThreads((current) => new Set(current).add(row.message.id));
                        onNotice("线程回复已保存并同步。");
                      } catch {
                        // The thread component renders the hook error.
                      }
                    }}
                    onUpdateReply={updateReply}
                    onRemoveReply={removeReply}
                    onClearThread={() => clearThread(row.message.id)}
                    onForwardReply={(replyId, content) => {
                      setPendingForward({ messageId: replyId, content, threadParentId: row.message.id });
                      setShowPicker(true);
                    }}
                    onNotice={onNotice}
                  />
                </div>
              </article>
              </div>
              )
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        <ScrollToBottom visible={userScrolledUp} onClick={scrollToBottom} />

        {bulkMode && (
          <div className="bulk-action-bar" role="region" aria-label="批量操作">
            <span className="bulk-count">已选 {bulkSelected.size} 条</span>
            <button type="button" className="ghost-button" onClick={selectAllMessages}>
              <Check size={14} /> 全选
            </button>
            <button type="button" className="ghost-button" onClick={clearBulkSelection}>
              <X size={14} /> 取消
            </button>
            <button type="button" className="ghost-button" onClick={copySelectedMessages} disabled={bulkSelected.size === 0}>
              <Copy size={14} /> 复制
            </button>
            <button type="button" className="ghost-button" onClick={bookmarkSelectedMessages} disabled={bulkSelected.size === 0 || !conversation}>
              <Bookmark size={14} /> 收藏
            </button>
          </div>
        )}

        <div className="composer">
          {draft.selectedParentId !== null && <div className="draft-note">正在从旧问题处分支。发送后会保留原分支。</div>}
          {!draft.content.trim() && messages.length > 0 && (
            <PromptSuggestions onSelect={(text) => setDraft({ ...draft, content: text })} showFollowups />
          )}
          {!draft.content.trim() && messages.length === 0 && (
            <PromptSuggestions onSelect={(text) => setDraft({ ...draft, content: text })} showFollowups={false} />
          )}
          {draft.content.trim() && (
            <div className="template-actions">
              <button type="button" className="ghost-button" onClick={() => {
                const name = draft.content.trim().slice(0, 30);
                save(name, draft.content);
                onNotice(`模板"${name}"已保存。`);
              }}>
                <Save size={14} /> 保存为模板
              </button>
              <button type="button" className="ghost-button" onClick={() => setShowTemplates((s) => !s)}>
                <FileText size={14} /> {showTemplates ? "收起模板" : "使用模板"}
              </button>
            </div>
          )}
          {draft.content.trim() && promptSuggestions.length > 0 && (
            <div className="prompt-history-suggestions" role="list" aria-label="历史提示词建议">
              <span className="prompt-history-label">历史：</span>
              {promptSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="ghost-button prompt-history-chip"
                  onClick={() => setDraft({ ...draft, content: s })}
                  role="listitem"
                  title={s}
                >
                  {s.length > 40 ? s.slice(0, 40) + "…" : s}
                </button>
              ))}
            </div>
          )}
          {showTemplates && (
            <div className="template-list" role="list">
              {templates.length === 0 ? (
                <p className="template-empty">暂无保存的模板。输入提示词后点击"保存为模板"。</p>
              ) : (
                templates.map((t) => (
                  <div key={t.id} className="template-item" role="listitem">
                    <button type="button" className="template-name" onClick={() => {
                      setDraft({ ...draft, content: expandVariables(t.prompt) });
                      setShowTemplates(false);
                      window.requestAnimationFrame(() => textareaRef.current?.focus());
                    }}>
                      <span>{t.name}</span>
                    </button>
                    <button type="button" className="template-delete" onClick={() => remove(t.id)} aria-label={`删除模板 ${t.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
          <div className="composer-input-wrapper">
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
            <div className="composer-input-extras">
              <VoiceInputButton
                onTranscript={(text) => setDraft((prev) => ({ ...prev, content: prev.content ? prev.content + " " + text : text }))}
              />
            </div>
          </div>
          <div className="composer-actions">
            <span className="char-count">{draft.content.length}/8000</span>
            {draft.content.trim().length > 0 && (
              <div className="prompt-enhance-group">
                <button type="button" className="ghost-button enhance-btn" onClick={() => setDraft((prev) => ({ ...prev, content: enhancePrompt(prev.content, "rewrite") }))} title="改写提示词">
                  改写
                </button>
                <button type="button" className="ghost-button enhance-btn" onClick={() => setDraft((prev) => ({ ...prev, content: enhancePrompt(prev.content, "expand") }))} title="扩展提示词">
                  扩展
                </button>
                <button type="button" className="ghost-button enhance-btn" onClick={() => setDraft((prev) => ({ ...prev, content: enhancePrompt(prev.content, "formal") }))} title="正式语气">
                  正式
                </button>
                <button type="button" className="ghost-button enhance-btn" onClick={() => setDraft((prev) => ({ ...prev, content: enhancePrompt(prev.content, "casual") }))} title="随意语气">
                  随意
                </button>
                <button type="button" className="ghost-button enhance-btn" onClick={() => setDraft((prev) => ({ ...prev, content: enhancePrompt(prev.content, "shorten") }))} title="精简提示词">
                  精简
                </button>
              </div>
            )}
            <button type="button" className="ghost-button" onClick={clearDraft}>
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
        <InfoLine label="线程数" value={String(Object.keys(repliesByParent).length)} />
        <InfoLine label="置顶数" value={String(getPinnedMessages(messages.map((m) => m.id)).length)} />
        <ThreadCenter
          messages={messages}
          repliesByParent={repliesByParent}
          loading={threadsLoading}
          error={threadError}
          onOpenThread={(messageId) => {
            setPanelOpen(true);
            setExpandedThreads((current) => new Set(current).add(messageId));
            window.requestAnimationFrame(() => {
              messageRefs.current.get(messageId)?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
          }}
        />
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
                <div key={idx} className="pinned-item forward-item">
                  <span className="forward-target">→ {f.targetConversation}</span>
                  <span className="forward-preview">{f.content.slice(0, 40)}{f.content.length > 40 ? "..." : ""}</span>
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
        <Suspense fallback={<div className="stats-skeleton" />}>
          <StatsPanel conversations={allConversations} messages={messages} assets={allAssets} usage={usageStats || { messageSent: 0, imageGenerated: 0, videoGenerated: 0, imageEdited: 0, videoAbandoned: 0 }} events={usageEvents || []} />
        </Suspense>
        <img src="/brand/mascot.png" alt="" className="panel-mascot" />
      </aside>

      <Suspense fallback={null}>
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={conversation?.title || "新会话"}
        messages={messages}
      />
      </Suspense>

      <ConversationPickerModal
        isOpen={showPicker}
        onClose={() => { setShowPicker(false); setPendingForward(null); }}
        excludeId={conversation?.id}
        onSelect={async (target) => {
          if (!pendingForward) return;
          const { messageId, content, threadParentId } = pendingForward;
          try {
            await streamChat(
              { conversationId: target.id, content },
              { onEvent: () => {} },
            );
            logForward(messageId, content, target.title, target.id, conversation?.id, conversation?.title, threadParentId);
            onNotice(`消息已转发到"${target.title}"`);
          } catch {
            onNotice("转发失败，请重试");
          } finally {
            setPendingForward(null);
          }
        }}
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </section>
  );
}
