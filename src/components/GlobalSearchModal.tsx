import { useEffect, useMemo, useRef, useState } from "react";
import { Folder, Hash, Image as ImageIcon, MessageSquare, Search, Tag, X } from "lucide-react";
import type { AssetItem, ChatMessage, ConversationSummary } from "../types";
import { useCollections } from "../hooks/useCollections";
import { useAssetTags } from "../hooks/useAssetTags";
import { useSavedSearches } from "../hooks/useSavedSearches";

export interface GlobalSearchResult {
  type: "message" | "asset" | "conversation" | "tag" | "collection";
  id: string;
  title: string;
  subtitle?: string;
  match?: string;
  onClick: () => void;
}

export function GlobalSearchModal({
  open,
  onClose,
  conversations,
  activeConversationId,
  activeMessages,
  assets,
  onSelectConversation,
  onSelectMessage,
  onSelectAsset,
  onSelectTag,
  onSelectCollection,
}: {
  open: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeConversationId?: string | null;
  activeMessages: ChatMessage[];
  assets: AssetItem[];
  onSelectConversation: (id: string) => void;
  onSelectMessage?: (conversationId: string, messageId: string, query: string) => void;
  onSelectAsset: (asset: AssetItem) => void;
  onSelectTag?: (tag: string) => void;
  onSelectCollection?: (collectionId: string, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const collections = useCollections();
  const { tagFrequency } = useAssetTags();
  const savedSearches = useSavedSearches();

  useEffect(() => {
    if (!open) return;
    const input = inputRef.current;
    if (input) input.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  const results: GlobalSearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: GlobalSearchResult[] = [];
    for (const c of conversations) {
      if (c.title.toLowerCase().includes(q)) {
        out.push({
          type: "conversation",
          id: `conv-${c.id}`,
          title: c.title || "新会话",
          subtitle: `${c.messageCount || 0} 条消息`,
          match: c.title,
          onClick: () => { onSelectConversation(c.id); onClose(); },
        });
      }
    }
    const messageConversationId = activeConversationId || null;
    const activeConversation = conversations.find((conversation) => conversation.id === messageConversationId);
    if (messageConversationId) {
      for (const m of activeMessages) {
        if (m.content.toLowerCase().includes(q)) {
          out.push({
            type: "message",
            id: `msg-${m.id}`,
            title: (m.role === "user" ? "你: " : "助手: ") + (m.content || "").slice(0, 80),
            subtitle: activeConversation?.title || "当前会话",
            match: m.content,
            onClick: () => {
              if (onSelectMessage) onSelectMessage(messageConversationId, m.id, query.trim());
              else onSelectConversation(messageConversationId);
              onClose();
            },
          });
        }
      }
    }
    for (const a of assets) {
      if (a.filename.toLowerCase().includes(q)) {
        out.push({
          type: "asset",
          id: `asset-${a.id}`,
          title: a.filename,
          subtitle: `${a.kind} · ${a.mediaType}`,
          match: a.filename,
          onClick: () => { onSelectAsset(a); onClose(); },
        });
      }
    }
    for (const [tag, count] of Object.entries(tagFrequency())) {
      if (tag.includes(q) && count > 0) {
        out.push({
          type: "tag",
          id: `tag-${tag}`,
          title: `#${tag}`,
          subtitle: `${count} 个资产`,
          onClick: () => { onSelectTag?.(tag); onClose(); },
        });
      }
    }
    for (const c of collections.collections) {
      if (c.name.toLowerCase().includes(q)) {
        out.push({
          type: "collection",
          id: `col-${c.id}`,
          title: c.name,
          subtitle: `集合 · ${c.assetIds.length} 个资产`,
          onClick: () => { onSelectCollection?.(c.id, c.name); onClose(); },
        });
      }
    }
    return out.slice(0, 30);
  }, [query, conversations, activeConversationId, activeMessages, assets, tagFrequency, collections.collections, onSelectConversation, onSelectMessage, onSelectAsset, onSelectTag, onSelectCollection, onClose]);

  const grouped = useMemo(() => {
    const groups: Record<string, GlobalSearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIndex];
      if (r) r.onClick();
    }
  };

  const groupLabels: Record<string, { label: string; icon: typeof Hash }> = {
    conversation: { label: "对话", icon: MessageSquare },
    message: { label: "消息", icon: Hash },
    asset: { label: "素材", icon: ImageIcon },
    tag: { label: "标签", icon: Tag },
    collection: { label: "集合", icon: Folder },
  };

  let runningIndex = 0;
  const hasQuery = query.trim() !== "";
  const trimmedQuery = query.trim();
  const activePosition = results.length > 0 ? Math.min(activeIndex + 1, results.length) : 0;
  const canSaveQuery = trimmedQuery.length > 0 && !savedSearches.saved.some((saved) => saved.query === trimmedQuery);
  const applySavedQuery = (savedQuery: string) => {
    setQuery(savedQuery);
    setActiveIndex(0);
  };

  return (
    <div className="global-search-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="全局搜索">
      <div className="global-search" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-header">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="搜索对话、消息、素材、标签、集合..."
            className="global-search-input"
            aria-label="全局搜索"
          />
          <span className="global-search-esc">Esc</span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="global-search-status" aria-live="polite">
          <div className="global-search-summary">
            {!hasQuery ? (
              <span>输入关键词后开始搜索</span>
            ) : results.length === 0 ? (
              <span>没有匹配结果</span>
            ) : (
              <>
                <span>共 {results.length} 个结果</span>
                <span>当前 {activePosition}/{results.length}</span>
              </>
            )}
            {canSaveQuery && (
              <button
                type="button"
                className="global-search-save"
                onClick={() => {
                  savedSearches.add({
                    name: trimmedQuery,
                    query: trimmedQuery,
                    roleFilter: "all",
                    dateFilter: "all",
                  });
                }}
              >
                保存本次搜索
              </button>
            )}
          </div>
          <div className="global-search-shortcuts" aria-label="搜索快捷键">
            <span>↑↓ 选择</span>
            <span>Enter 打开</span>
            <span>Esc 关闭</span>
          </div>
        </div>
        <div className="global-search-results">
          {query.trim() === "" ? (
            <div className="global-search-empty">
              <Search size={32} />
              <span>输入关键词开始全局搜索</span>
              {savedSearches.saved.length > 0 && (
                <div className="global-search-saved-list" aria-label="已保存搜索">
                  {savedSearches.saved.slice(0, 6).map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      className="global-search-saved-chip"
                      onClick={() => applySavedQuery(saved.query)}
                    >
                      使用已保存搜索：{saved.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="global-search-empty">
              <Search size={32} />
              <span>没有匹配的结果</span>
            </div>
          ) : (
            Object.entries(grouped).map(([groupKey, items]) => {
              const meta = groupLabels[groupKey];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div key={groupKey} className="global-search-group">
                  <div className="global-search-group-label">
                    <Icon size={12} /> {meta.label} ({items.length})
                  </div>
                  {items.map((r) => {
                    const isActive = runningIndex === activeIndex;
                    const idx = runningIndex;
                    runningIndex++;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`global-search-item${isActive ? " active" : ""}`}
                        aria-current={isActive ? "true" : undefined}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={r.onClick}
                      >
                        <div className="global-search-item-content">
                          <span className="global-search-item-title">{r.title}</span>
                          {r.subtitle && <span className="global-search-item-subtitle">{r.subtitle}</span>}
                        </div>
                        <span className="global-search-item-type">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
