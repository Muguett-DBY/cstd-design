import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, Calendar, CheckSquare, ChevronDown, ChevronUp, Clock, Folder, FolderPlus, Filter, GitMerge, GripVertical, MessageSquare, Pin, Plus, Search, Square, Star, Tag, Trash2, X } from "lucide-react";
import { ImportConversationButton } from "./ImportConversationButton";
import { Brand } from "./Brand";
import { UserFooter } from "./UserFooter";
import { TABS } from "../constants";
import { timeAgo } from "../app-state";
import type { WorkspaceTab, ConversationSummary } from "../types";
import { useConversationOrder } from "../hooks/useConversationOrder";
import { useConversationFolders } from "../hooks/useConversationFolders";
import { useConversationArchiving } from "../hooks/useConversationArchiving";
import { usePinnedConversations, partitionPinned } from "../hooks/usePinnedConversations";
import { useConversationMerging } from "../hooks/useConversationMerging";
import type { Folder as FolderType } from "../hooks/useConversationFolders";

type SortMode = "updatedAt" | "createdAt" | "title" | "messageCount";
type DateFilter = "all" | "today" | "week" | "month";
type MessageCountFilter = "all" | "1-10" | "11-50" | "51-100" | "100+";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "updatedAt", label: "最近更新" },
  { value: "createdAt", label: "创建时间" },
  { value: "title", label: "按标题" },
  { value: "messageCount", label: "按消息数" },
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

function filterByDate(items: ConversationSummary[], filter: DateFilter, dateRange?: { start: string; end: string }): ConversationSummary[] {
  if (filter === "all" && (!dateRange?.start || !dateRange?.end)) return items;
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return items.filter((item) => {
    const date = new Date(item.updatedAt);
    
    // Date range filter
    if (dateRange?.start && dateRange?.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (date < start || date > end) return false;
    }
    
    // Date filter
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
    case "messageCount":
      return sorted.sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
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
  folder,
  onAssignFolder,
  folders,
  isArchived,
  onToggleArchive,
  isBulkSelected,
  onToggleBulkSelect,
  bulkMode,
  onMerge,
  conversations,
  pinned,
  onTogglePin,
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
  folder: FolderType | null;
  onAssignFolder: (conversationId: string, folderId: string | null) => void;
  folders: FolderType[];
  isArchived: boolean;
  onToggleArchive: () => void;
  isBulkSelected: boolean;
  onToggleBulkSelect: () => void;
  bulkMode: boolean;
  onMerge: (targetId: string) => void;
  conversations: ConversationSummary[];
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const snippet = item.lastMessage ? item.lastMessage.slice(0, 60) + (item.lastMessage.length > 60 ? "..." : "") : "";
  return (
    <div
      className={`conversation-card-wrapper${dragOverId === item.id ? " drag-over" : ""}${isArchived ? " archived" : ""}${isBulkSelected ? " bulk-selected" : ""}`}
      draggable={!bulkMode}
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, item.id)}
    >
      {bulkMode ? (
        <button type="button" className="bulk-select-btn" onClick={onToggleBulkSelect}>
          {isBulkSelected ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>
      ) : (
        <div className="drag-handle">
          <GripVertical size={14} />
        </div>
      )}
      <button type="button" className={`${isActive ? "conversation-card active" : "conversation-card"}${pinned ? " pinned" : ""}`} onClick={bulkMode ? onToggleBulkSelect : onSelect}>
        <div className="conversation-card-header">
          {folder && <span className="conversation-folder-tag" style={{ background: folder.color }}>{folder.name}</span>}
          {isArchived && <span className="conversation-archived-tag">已归档</span>}
          {pinned && <Star size={12} className="conversation-pinned-icon" aria-label="已置顶" />}
          <strong>{item.title}</strong>
        </div>
        {snippet && <span className="conversation-snippet">{snippet}</span>}
        <div className="conversation-card-meta">
          <span>{timeAgo(item.updatedAt)}</span>
          {item.messageCount && item.messageCount > 0 && (
            <span className="conversation-message-count">{item.messageCount} 条</span>
          )}
        </div>
      </button>
      {!bulkMode && (
        <div className="conversation-card-actions">
          <select
            className="folder-select"
            value={folder?.id || ""}
            onChange={(e) => onAssignFolder(item.id, e.target.value || null)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">无文件夹</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            className="folder-select"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                const target = conversations.find((c) => c.id === e.target.value);
                if (target && window.confirm(`确认将"${item.title}"合并到"${target.title}"？\n\n源会话的消息将被移动到目标会话。`)) {
                  onMerge(e.target.value);
                }
              }
            }}
            onClick={(e) => e.stopPropagation()}
            title="合并到其他会话"
          >
            <option value="">合并</option>
            {conversations.filter((c) => c.id !== item.id).map((c) => (
              <option key={c.id} value={c.id}>{c.title.slice(0, 20)}</option>
            ))}
          </select>
          <button type="button" className="conversation-archive" aria-label={isArchived ? "取消归档" : "归档会话"} onClick={(e) => { e.stopPropagation(); onToggleArchive(); }} title={isArchived ? "取消归档" : "归档会话"}>
            {isArchived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
          </button>
          <button type="button" className={`conversation-pin${pinned ? " pinned" : ""}`} aria-label={pinned ? "取消置顶" : "置顶会话"} onClick={(e) => { e.stopPropagation(); onTogglePin(); }} title={pinned ? "取消置顶" : "置顶会话"} aria-pressed={pinned}>
            <Pin size={12} />
          </button>
          <button type="button" className="conversation-delete" aria-label="删除会话" onClick={(e) => { e.stopPropagation(); onRequestConfirm("删除会话", `确认删除会话"${item.title}"？此操作不可恢复。`, true, onDelete); }}>
            <X size={12} />
          </button>
        </div>
      )}
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
  onImportConversation,
  onDeleteConversation,
  onBulkDelete,
  onRequestConfirm,
  onNotice,
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
  onImportConversation?: (data: { title: string; messages: { role: string; content: string; createdAt?: string }[] }) => Promise<void> | void;
  onDeleteConversation: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRequestConfirm: (title: string, message: string, danger: boolean, onConfirm: () => void) => void;
  onNotice?: (msg: string) => void;
  dark: boolean;
  onThemeToggle: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updatedAt");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [messageCountFilter, setMessageCountFilter] = useState<MessageCountFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { reorder, onDragStart, onDragOver, onDrop } = useConversationOrder();
  const { folders, createFolder, deleteFolder, assignToFolder, getConversationFolder, autoCategorize } = useConversationFolders();
  const { isArchived, toggleArchive, bulkArchive, bulkUnarchive } = useConversationArchiving();
  const { toggle: togglePinned, isPinned, allPinned, bulkPin, bulkUnpin } = usePinnedConversations();
  const { mergeConversations, merged } = useConversationMerging();

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
          <span>会话列表 {conversations.length > 0 && <span className="conversation-count">{conversations.length}</span>}{conversations.some((c) => c.messageCount) && <span className="conversation-stat" title="总消息数"> · {conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0)} 条消息</span>}</span>
          <div className="panel-heading-actions">
            {conversations.length > 0 && (
              <button type="button" className={`icon-button${bulkMode ? " active" : ""}`} aria-label="批量选择" onClick={() => { setBulkMode(!bulkMode); setSelectedConversations(new Set()); }} title={bulkMode ? "退出批量选择" : "批量选择"}>
                {bulkMode ? <X size={18} /> : <CheckSquare size={18} />}
              </button>
            )}
            <button type="button" className="icon-button" aria-label="新建会话" onClick={onCreateConversation}>
              <Plus size={18} />
            </button>
            {onImportConversation && (
              <ImportConversationButton
                onImport={onImportConversation}
                onNotice={() => {}}
              />
            )}
          </div>
        </div>
        <label className="search-box">
          <Search size={16} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索会话..." />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              title="清空搜索"
              aria-label="清空搜索"
            >
              <X size={12} />
            </button>
          )}
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
                    aria-pressed={dateFilter === opt.value}
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
                    aria-pressed={messageCountFilter === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label"><Calendar size={12} /> 日期范围</span>
              <div className="filter-date-range">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="filter-date-input"
                />
                <span className="filter-date-separator">至</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="filter-date-input"
                />
              </div>
            </div>
            {(dateFilter !== "all" || messageCountFilter !== "all" || dateRange.start || dateRange.end) && (
              <button
                type="button"
                className="filter-clear-all"
                onClick={() => {
                  setDateFilter("all");
                  setMessageCountFilter("all");
                  setDateRange({ start: "", end: "" });
                }}
              >
                清除全部筛选
              </button>
            )}
          </div>
        )}
        <div className="sort-bar">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={sortMode === opt.value ? "sort-option active" : "sort-option"}
              onClick={() => setSortMode(opt.value)}
              aria-pressed={sortMode === opt.value}
            >
              {sortMode === opt.value ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {opt.label}
            </button>
          ))}
        </div>
        <div className="folder-bar">
          <button type="button" className={selectedFolder === null ? "folder-chip active" : "folder-chip"} onClick={() => setSelectedFolder(null)} aria-pressed={selectedFolder === null}>
            <Tag size={12} /> 全部
          </button>
          {folders.map((f) => {
            const folderCount = conversations.filter((c) => getConversationFolder(c.id)?.id === f.id).length;
            return (
            <button
              key={f.id}
              type="button"
              className={selectedFolder === f.id ? "folder-chip active" : "folder-chip"}
              style={{ borderColor: f.color }}
              onClick={() => setSelectedFolder(selectedFolder === f.id ? null : f.id)}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => {
                e.preventDefault();
                const convId = e.dataTransfer.getData("text/plain");
                if (convId) assignToFolder(convId, f.id);
              }}
              aria-pressed={selectedFolder === f.id}
            >
              <Folder size={12} style={{ color: f.color }} /> {f.name}
              {folderCount > 0 && <span className="folder-count">{folderCount}</span>}
              <span className="folder-delete" onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }} title="删除文件夹" role="button" tabIndex={0} aria-label="删除文件夹">
                <X size={10} />
              </span>
            </button>
            );
          })}
          <button type="button" className={`folder-chip${showArchived ? " active" : ""}`} onClick={() => setShowArchived(!showArchived)} aria-pressed={showArchived}>
            <Archive size={12} /> 归档
            {conversations.filter((c) => isArchived(c.id)).length > 0 && (
              <span className="folder-count">{conversations.filter((c) => isArchived(c.id)).length}</span>
            )}
          </button>
          <button type="button" className="folder-add-btn" onClick={() => setShowFolderInput(!showFolderInput)} title="新建文件夹">
            <FolderPlus size={14} />
          </button>
          <button type="button" className="folder-add-btn" onClick={() => {
            const count = autoCategorize(conversations.map((c) => ({ id: c.id, title: c.title })));
            if (count > 0) onNotice?.(`已自动分类 ${count} 个对话。`);
            else onNotice?.("没有需要分类的对话。");
          }} title="自动分类" style={{ marginLeft: 4 }}>
            <Tag size={14} />
          </button>
        </div>
        {showFolderInput && (
          <div className="folder-input-row">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="文件夹名称..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolder(newFolderName.trim());
                  setNewFolderName("");
                  setShowFolderInput(false);
                }
                if (e.key === "Escape") setShowFolderInput(false);
              }}
              autoFocus
            />
            <button type="button" className="ghost-button" onClick={() => {
              if (newFolderName.trim()) {
                createFolder(newFolderName.trim());
                setNewFolderName("");
              }
              setShowFolderInput(false);
            }}>创建</button>
          </div>
        )}
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">{query ? "未找到匹配的会话" : "还没有会话，点击 + 新建一个"}</div>
          ) : (
            <>
              {bulkMode && (
                <div className="bulk-actions">
                  <button type="button" className="bulk-select-all" onClick={() => {
                    const filtered = reorder(sortConversations(filterByMessageCount(filterByDate(conversations, dateFilter, dateRange), messageCountFilter), sortMode))
                      .filter((item) => !selectedFolder || getConversationFolder(item.id)?.id === selectedFolder)
                      .filter((item) => showArchived ? isArchived(item.id) : !isArchived(item.id));
                    if (selectedConversations.size === filtered.length) {
                      setSelectedConversations(new Set());
                    } else {
                      setSelectedConversations(new Set(filtered.map((item) => item.id)));
                    }
                  }}>
                    {selectedConversations.size === reorder(sortConversations(filterByMessageCount(filterByDate(conversations, dateFilter, dateRange), messageCountFilter), sortMode))
                      .filter((item) => !selectedFolder || getConversationFolder(item.id)?.id === selectedFolder)
                      .filter((item) => showArchived ? isArchived(item.id) : !isArchived(item.id)).length ? <CheckSquare size={14} /> : <Square size={14} />}
                    全选
                  </button>
                  <span className="bulk-selected-count">已选 {selectedConversations.size} 项</span>
                  <button type="button" className="bulk-archive-btn" disabled={selectedConversations.size === 0} onClick={() => {
                    const ids = Array.from(selectedConversations);
                    if (showArchived) {
                      bulkUnarchive(ids);
                    } else {
                      bulkArchive(ids);
                    }
                    setSelectedConversations(new Set());
                    setBulkMode(false);
                  }}>
                    {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    {showArchived ? "取消归档" : "归档选中"}
                  </button>
                  <button type="button" className="bulk-pin-btn" disabled={selectedConversations.size === 0} onClick={() => {
                    const ids = Array.from(selectedConversations);
                    if (allPinned(ids)) {
                      bulkUnpin(ids);
                    } else {
                      bulkPin(ids);
                    }
                  }}>
                    <Star size={14} />
                    {allPinned(Array.from(selectedConversations)) ? "取消置顶" : "置顶选中"}
                  </button>
                  {onBulkDelete && (
                    <button type="button" className="bulk-delete-btn danger" disabled={selectedConversations.size === 0} onClick={() => {
                      onBulkDelete(Array.from(selectedConversations));
                      setSelectedConversations(new Set());
                      setBulkMode(false);
                    }}>
                      <Trash2 size={14} />
                      删除选中
                    </button>
                  )}
                </div>
              )}
              {(() => {
                const allFiltered = reorder(sortConversations(filterByMessageCount(filterByDate(conversations, dateFilter, dateRange), messageCountFilter), sortMode))
                  .filter((item) => !selectedFolder || getConversationFolder(item.id)?.id === selectedFolder)
                  .filter((item) => showArchived ? isArchived(item.id) : !isArchived(item.id));
                const pinnedIds = new Set<string>();
                for (const c of allFiltered) if (isPinned(c.id)) pinnedIds.add(c.id);
                const { pinnedItems: pinnedList, otherItems: otherList } = partitionPinned(allFiltered, pinnedIds);
                return (
                  <>
                    {pinnedList.length > 0 && !showArchived && (
                      <div className="conversation-section-header">
                        <Star size={11} /> 置顶
                      </div>
                    )}
                    {pinnedList.map((item) => (
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
                        folder={getConversationFolder(item.id)}
                        onAssignFolder={assignToFolder}
                        folders={folders}
                        isArchived={isArchived(item.id)}
                        onToggleArchive={() => toggleArchive(item.id)}
                        isBulkSelected={selectedConversations.has(item.id)}
                        onToggleBulkSelect={() => {
                          setSelectedConversations((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) {
                              next.delete(item.id);
                            } else {
                              next.add(item.id);
                            }
                            return next;
                          });
                        }}
                        bulkMode={bulkMode}
                        onMerge={(targetId) => {
                          mergeConversations(item.id, targetId);
                        }}
                        conversations={conversations}
                        pinned={true}
                        onTogglePin={() => togglePinned(item.id)}
                      />
                    ))}
                    {pinnedList.length > 0 && otherList.length > 0 && !showArchived && (
                      <div className="conversation-section-header">
                        所有会话
                      </div>
                    )}
                    {otherList.map((item) => (
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
                  folder={getConversationFolder(item.id)}
                  onAssignFolder={assignToFolder}
                  folders={folders}
                  isArchived={isArchived(item.id)}
                  onToggleArchive={() => toggleArchive(item.id)}
                  isBulkSelected={selectedConversations.has(item.id)}
                  onToggleBulkSelect={() => {
                    setSelectedConversations((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) {
                        next.delete(item.id);
                      } else {
                        next.add(item.id);
                      }
                      return next;
                    });
                  }}
                  bulkMode={bulkMode}
                  onMerge={(targetId) => {
                    mergeConversations(item.id, targetId);
                  }}
                  conversations={conversations}
                  pinned={isPinned(item.id)}
                  onTogglePin={() => togglePinned(item.id)}
                />
              ))}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </section>
      <div className="keyboard-hints">
        <button type="button" className="keyboard-hints-toggle" onClick={() => {
          const el = document.querySelector('.keyboard-shortcuts-panel');
          if (el) {
            el.classList.toggle('open');
          }
        }}>
          快捷键帮助
        </button>
        <div className="keyboard-shortcuts-panel">
          <div className="keyboard-shortcuts-header">
            <span>键盘快捷键</span>
          </div>
          <input
            type="text"
            className="keyboard-shortcuts-search"
            placeholder="搜索快捷键..."
            onChange={(e) => {
              const query = e.target.value.toLowerCase();
              const items = document.querySelectorAll('.keyboard-shortcut-item');
              items.forEach((item) => {
                const desc = item.querySelector('.keyboard-shortcut-desc')?.textContent?.toLowerCase() || '';
                const keys = item.querySelector('.keyboard-shortcut-keys')?.textContent?.toLowerCase() || '';
                (item as HTMLElement).style.display = (desc.includes(query) || keys.includes(query)) ? '' : 'none';
              });
            }}
          />
          <div className="keyboard-shortcuts-list">
            <div className="keyboard-shortcut-category">会话</div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">搜索会话</span>
              <span className="keyboard-shortcut-keys"><kbd>Ctrl</kbd>+<kbd>K</kbd></span>
            </div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">新建会话</span>
              <span className="keyboard-shortcut-keys"><kbd>Ctrl</kbd>+<kbd>N</kbd></span>
            </div>
            <div className="keyboard-shortcut-category">消息</div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">查找消息</span>
              <span className="keyboard-shortcut-keys"><kbd>Ctrl</kbd>+<kbd>F</kbd></span>
            </div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">发送消息</span>
              <span className="keyboard-shortcut-keys"><kbd>Enter</kbd></span>
            </div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">换行</span>
              <span className="keyboard-shortcut-keys"><kbd>Shift</kbd>+<kbd>Enter</kbd></span>
            </div>
            <div className="keyboard-shortcut-category">搜索</div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">关闭搜索</span>
              <span className="keyboard-shortcut-keys"><kbd>Esc</kbd></span>
            </div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">上一个搜索结果</span>
              <span className="keyboard-shortcut-keys"><kbd>Shift</kbd>+<kbd>Enter</kbd></span>
            </div>
            <div className="keyboard-shortcut-item">
              <span className="keyboard-shortcut-desc">下一个搜索结果</span>
              <span className="keyboard-shortcut-keys"><kbd>Enter</kbd></span>
            </div>
          </div>
        </div>
      </div>
      {Object.keys(merged).length > 0 && (
        <div className="merge-history-section">
          <span className="merge-history-header"><GitMerge size={12} /> 合并记录</span>
          <div className="merge-history-list">
            {Object.entries(merged).slice(-3).map(([sourceId, record]: [string, { sourceId: string; targetId: string; mergedAt: string }]) => {
              const source = conversations.find((c) => c.id === sourceId);
              const target = conversations.find((c) => c.id === record.targetId);
              return (
                <div key={sourceId} className="merge-history-item">
                  <span className="merge-history-source">{source?.title || "已删除"}</span>
                  <span className="merge-history-arrow">→</span>
                  <span className="merge-history-target">{target?.title || "已删除"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <UserFooter dark={dark} onThemeToggle={onThemeToggle} onLogout={onLogout} />
    </>
  );
}
