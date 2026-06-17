import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Brand } from "./Brand";
import { UserFooter } from "./UserFooter";
import { TABS } from "../constants";
import type { WorkspaceTab, ConversationSummary } from "../types";

export function Sidebar({
  activeTab,
  onTabChange,
  conversations,
  activeConversationId,
  onSearch,
  onSelectConversation,
  onCreateConversation,
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
  dark: boolean;
  onThemeToggle: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
          <span>会话列表</span>
          <button type="button" className="icon-button" aria-label="新建会话" onClick={onCreateConversation}>
            <Plus size={18} />
          </button>
        </div>
        <label className="search-box">
          <Search size={16} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索会话" />
        </label>
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">{query ? "未找到匹配的会话" : "还没有会话，点击 + 新建一个"}</div>
          ) : (
            conversations.map((item) => (
              <button key={item.id} type="button" className={item.id === activeConversationId ? "conversation-card active" : "conversation-card"} onClick={() => onSelectConversation(item.id)}>
                <strong>{item.title}</strong>
                <span>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</span>
              </button>
            ))
          )}
        </div>
      </section>
      <UserFooter dark={dark} onThemeToggle={onThemeToggle} onLogout={onLogout} />
    </>
  );
}
