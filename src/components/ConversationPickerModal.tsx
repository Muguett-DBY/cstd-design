import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, MessageSquare, Clock } from "lucide-react";
import { api } from "../api";
import type { ConversationSummary } from "../types";

interface ConversationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (conversation: ConversationSummary) => void;
  excludeId?: string;
}

export function ConversationPickerModal({ isOpen, onClose, onSelect, excludeId }: ConversationPickerModalProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || loadedRef.current) return;
    loadedRef.current = true;
    api.conversations("")
      .then((res) => setConversations(res.conversations))
      .catch(() => setError("加载会话列表失败"));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    setSearch("");
    loadedRef.current = false;
    onClose();
  };

  const filtered = useMemo(() => {
    const list = conversations.filter((c) => c.id !== excludeId);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search, excludeId]);

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={handleClose}>
      <div className="export-modal picker-modal" role="dialog" aria-modal="true" aria-label="选择目标会话" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>选择目标会话</h3>
          <button type="button" className="export-modal-close" onClick={handleClose} aria-label="关闭选择对话框">
            <X size={18} />
          </button>
        </div>
        <div className="export-modal-body picker-body">
          <div className="picker-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="搜索会话..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="picker-list">
            {conversations.length === 0 && !error && <div className="picker-empty">加载中...</div>}
            {error && <div className="picker-empty picker-error">{error}</div>}
            {!error && conversations.length > 0 && filtered.length === 0 && (
              <div className="picker-empty">{search ? "无匹配会话" : "暂无其他会话"}</div>
            )}
            {!error && filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className="picker-item"
                onClick={() => { onSelect(c); handleClose(); }}
              >
                <div className="picker-item-icon">
                  <MessageSquare size={16} />
                </div>
                <div className="picker-item-info">
                  <span className="picker-item-title">{c.title}</span>
                  <span className="picker-item-meta">
                    {c.messageCount != null && <span>{c.messageCount} 条消息</span>}
                    <span className="picker-item-time">
                      <Clock size={10} />
                      {new Date(c.updatedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="export-modal-footer">
          <button type="button" className="ghost-button" onClick={handleClose}>取消</button>
        </div>
      </div>
    </div>
  );
}
