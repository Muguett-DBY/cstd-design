import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Search, X } from "lucide-react";
import { Brand } from "./Brand";
import { UserFooter } from "./UserFooter";
import { TABS } from "../constants";
import { timeAgo } from "../app-state";
import type { WorkspaceTab, ConversationSummary } from "../types";
import { useConversationOrder } from "../hooks/useConversationOrder";

type SortMode = "updatedAt" | "createdAt" | "title";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "updatedAt", label: "最近更新" },
  { value: "createdAt", label: "创建时间" },
  { value: "title", label: "按标题" },
];

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
        </label>
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
            reorder(sortConversations(conversations, sortMode)).map((item) => (
              <div
                key={item.id}
                className={`conversation-card-wrapper${dragOverId === item.id ? " drag-over" : ""}`}
                draggable
                onDragStart={(e) => onDragStart(e, item.id)}
                onDragOver={(e) => { onDragOver(e); setDragOverId(item.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => { onDrop(e, item.id); setDragOverId(null); }}
              >
                <div className="drag-handle">
                  <GripVertical size={14} />
                </div>
                <button type="button" className={item.id === activeConversationId ? "conversation-card active" : "conversation-card"} onClick={() => onSelectConversation(item.id)}>
                  <strong>{item.title}</strong>
                  <span>{timeAgo(item.updatedAt)}</span>
                </button>
                <button type="button" className="conversation-delete" aria-label="删除会话" onClick={(e) => { e.stopPropagation(); onRequestConfirm("删除会话", `确认删除会话"${item.title}"？此操作不可恢复。`, true, () => onDeleteConversation(item.id)); }}>
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
      <UserFooter dark={dark} onThemeToggle={onThemeToggle} onLogout={onLogout} />
    </>
  );
}
