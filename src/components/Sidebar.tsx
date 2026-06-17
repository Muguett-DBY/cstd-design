import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clock, Filter, GripVertical, MessageSquare, Plus, Search, X } from "lucide-react";
import { Brand } from "./Brand";
import { UserFooter } from "./UserFooter";
import { TABS } from "../constants";
import { timeAgo } from "../app-state";
import type { WorkspaceTab, ConversationSummary } from "../types";
import { useConversationOrder } from "../hooks/useConversationOrder";

type SortMode = "updatedAt" | "createdAt" | "title";
type DateFilter = "all" | "today" | "week" | "month";
type MessageCountFilter = "all" | "1-10" | "11-50" | "51-100" | "100+";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "updatedAt", label: "最近更新" },
  { value: "createdAt", label: "创建时间" },
  { value: "title", label: "按标题" },
];

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "全部时间" },
  { value: "today", label: "今天" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
];

const MESSAGE_COUNT_OPTIONS: { value: MessageCountFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "1-10", label: "1-10 条" },
  { value: "11-50", label: "11-50 条" },
  { value: "51-100", label: "51-100 条" },
  { value: "100+", label: "100+ 条" },
];

function filterByDate(items: ConversationSummary[], filter: DateFilter): ConversationSummary[] {
  if (filter === "all") return items;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return items.filter((item) => {
    const date = new Date(item.updatedAt);
    switch (filter) {
      case "today": return date >= startOfDay;
      case "week": return date >= startOfWeek;
      case "month": return date >= startOfMonth;
      default: return true;
    }
  });
}

function filterByMessageCount(items: ConversationSummary[], filter: MessageCountFilter): ConversationSummary[] {
  if (filter === "all") return items;
  return items.filter((item) => {
    const count = item.messageCount || 0;
    switch (filter) {
      case "1-10": return count >= 1 && count <= 10;
      case "11-50": return count >= 11 && count <= 50;
      case "51-100": return count >= 51 && count <= 100;
      case "100+": return count > 100;
      default: return true;
    }
  });
}

function sortConversations(items: ConversationSummary[], mode: SortMode): ConversationSummary[] {
  const sorted = [...items];
  switch (mode) {
    case "updatedAt":
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case "createdAt":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
    default:
      return sorted;
  }
}

function ConversationCard({
  item,
  isActive,
  onSelect,
  onDelete,
  onRequestConfirm,
  dragOverId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  item: ConversationSummary;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRequestConfirm: (title: string, message: string, danger: boolean, onConfirm: () => void) => void;
  dragOverId: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}) {
  const snippet = item.lastMessage ? item.lastMessage.slice(0, 60) + (item.lastMessage.length > 60 ? "..." : "") : "";
  return (
    <div
      className={`conversation-card-wrapper${dragOverId === item.id ? " drag-over" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, item.id)}
    >
      <div className="drag-handle">
        <GripVertical size={14} />
      </div>
      <button type="button" className={isActive ? "conversation-card active" : "conversation-card"} onClick={onSelect}>
        <strong>{item.title}</strong>
        {snippet && <span className="conversation-snippet">{snippet}</span>}
        <span>{timeAgo(item.updatedAt)}{item.messageCount ? ` · ${item.messageCount} 条消息` : ""}</span>
      </button>
      <button type="button" className="conversation-delete" aria-label="删除会话" onClick={(e) => { e.stopPropagation(); onRequestConfirm("删除会话", `确认删除会话"${item.title}"？此操作不可恢复。`, true, onDelete); }}>
        <X size={12} />
      </button>
    </div>
  );
}

export function Sidebar({
  activeTab,
  onTabChange,
  conversations,
  activeConversationId,
  onSearch,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onRequestConfirm,
  dark,
  onThemeToggle,
  onLogout,
}: {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSearch: (q: string) => void;
  onSelectConversation: (id: string) => void | Promise<void>;
  onCreateConversation: () => void | Promise<void>;
  onDeleteConversation: (id: string) => void;
  onRequestConfirm: (title: string, message: string, danger: boolean, onConfirm: () => void) => void;
  dark: boolean;
  onThemeToggle: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updatedAt");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [messageCountFilter, setMessageCountFilter] = useState<MessageCountFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { reorder, onDragStart, onDragOver, onDrop } = useConversationOrder();

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => onSearch(query), 200);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, onSearch]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "n") {
        event.preventDefault();
        void onCreateConversation();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCreateConversation]);

  return (
    <>
      <Brand />
      <nav className="nav-list" aria-label="主导航">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={activeTab === tab.id ? "nav-item active" : "nav-item"} type="button" onClick={() => onTabChange(tab.id)}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <section className="conversation-panel">
        <div className="panel-heading">
          <span>会话列表 {conversations.length > 0 && <span className="conversation-count">{conversations.length}</span>}</span>
          <button type="button" className="icon-button" aria-label="新建会话" onClick={onCreateConversation}>
            <Plus size={18} />
          </button>
        </div>
        <label className="search-box">
          <Search size={16} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题或内容..." />
          <button type="button" className="filter-toggle" onClick={() => setShowFilters(!showFilters)} title="筛选">
            <Filter size={14} />
          </button>
        </label>
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <span className="filter-label"><Clock size={12} /> 时间</span>
              <div className="filter-options">
                {DATE_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={dateFilter === opt.value ? "filter-option active" : "filter-option"}
                    onClick={() => setDateFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label"><MessageSquare size={12} /> 消息数</span>
              <div className="filter-options">
                {MESSAGE_COUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={messageCountFilter === opt.value ? "filter-option active" : "filter-option"}
                    onClick={() => setMessageCountFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="sort-bar">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={sortMode === opt.value ? "sort-option active" : "sort-option"}
              onClick={() => setSortMode(opt.value)}
            >
              {sortMode === opt.value ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {opt.label}
            </button>
          ))}
        </div>
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">{query ? "未找到匹配的会话" : "还没有会话，点击 + 新建一个"}</div>
          ) : (
            reorder(sortConversations(filterByMessageCount(filterByDate(conversations, dateFilter), messageCountFilter), sortMode)).map((item) => (
              <ConversationCard
                key={item.id}
                item={item}
                isActive={item.id === activeConversationId}
                onSelect={() => onSelectConversation(item.id)}
                onDelete={() => onDeleteConversation(item.id)}
                onRequestConfirm={onRequestConfirm}
                dragOverId={dragOverId}
                onDragStart={onDragStart}
                onDragOver={(e, id) => { onDragOver(e); setDragOverId(id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e, id) => { onDrop(e, id); setDragOverId(null); }}
              />
            ))
          )}
        </div>
      </section>
      <div className="keyboard-hints">
        <span className="keyboard-hint"><kbd>Ctrl</kbd>+<kbd>K</kbd> 搜索</span>
        <span className="keyboard-hint"><kbd>Ctrl</kbd>+<kbd>N</kbd> 新建</span>
        <span className="keyboard-hint"><kbd>Ctrl</kbd>+<kbd>F</kbd> 查找消息</span>
      </div>
      <UserFooter dark={dark} onThemeToggle={onThemeToggle} onLogout={onLogout} />
    </>
  );
}
