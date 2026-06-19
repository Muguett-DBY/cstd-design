import { useState } from "react";
import { Eye, Globe, Trash2, X } from "lucide-react";
import { createShareLink, deleteShared, getSharedConversation, listShared, type SharedConversation } from "../hooks/useSharedConversations";

export function SharedConversationsModal({
  open,
  onClose,
  title,
  messages,
  onNotice,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  messages?: { role: string; content: string; createdAt?: string }[];
  onNotice: (msg: string) => void;
}) {
  const [list, setList] = useState<SharedConversation[]>(() => listShared());
  const [viewing, setViewing] = useState<SharedConversation | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  if (!open) return null;

  const handleShare = () => {
    if (!title || !messages) return;
    const shared = createShareLink(title, messages);
    const url = `${window.location.origin}${window.location.pathname}#share/${shared.token}`;
    setShareUrl(url);
    setList(listShared());
    onNotice(`已创建分享链接：${shared.token.slice(0, 8)}...`);
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      onNotice("链接已复制到剪贴板。");
    } catch {
      onNotice("复制失败。");
    }
  };

  const handleDelete = (token: string) => {
    deleteShared(token);
    setList(listShared());
    onNotice("分享链接已删除。");
  };

  return (
    <div className="shared-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="分享的对话">
      <div className="shared-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shared-modal-header">
          <h3><Globe size={16} /> 分享对话</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="shared-modal-content">
          {title && messages && (
            <div className="shared-create-section">
              <button type="button" className="primary-button" onClick={handleShare}>
                <Globe size={16} /> 为当前对话生成分享链接
              </button>
              {shareUrl && (
                <div className="shared-url-box">
                  <input type="text" value={shareUrl} readOnly />
                  <button type="button" className="ghost-button" onClick={() => handleCopyUrl(shareUrl)}>复制</button>
                </div>
              )}
            </div>
          )}
          <div className="shared-list-section">
            <h4>已分享的对话</h4>
            {list.length === 0 ? (
              <p className="shared-empty">还没有分享的对话。点击上方按钮创建一个。</p>
            ) : (
              <ul className="shared-list">
                {list.map((s) => {
                  const url = `${window.location.origin}${window.location.pathname}#share/${s.token}`;
                  return (
                    <li key={s.token} className="shared-item">
                      <div className="shared-item-content">
                        <strong>{s.title || "未命名对话"}</strong>
                        <span className="shared-item-meta">{s.messages.length} 条消息 · {new Date(s.createdAt).toLocaleString("zh-CN")}</span>
                      </div>
                      <div className="shared-item-actions">
                        <button type="button" className="icon-button" onClick={() => setViewing(s)} title="预览">
                          <Eye size={14} />
                        </button>
                        <button type="button" className="icon-button" onClick={() => handleCopyUrl(url)} title="复制链接">
                          <Globe size={14} />
                        </button>
                        <button type="button" className="icon-button" onClick={() => handleDelete(s.token)} title="删除">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      {viewing && (
        <SharedViewer shared={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

export function SharedViewer({ shared, onClose }: { shared: SharedConversation; onClose: () => void }) {
  return (
    <div className="shared-viewer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="分享预览">
      <div className="shared-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="shared-viewer-header">
          <h3>{shared.title || "未命名对话"}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="shared-viewer-meta">
          {shared.messages.length} 条消息 · 分享于 {new Date(shared.createdAt).toLocaleString("zh-CN")}
        </div>
        <div className="shared-viewer-content">
          {shared.messages.map((m, idx) => (
            <article key={idx} className={`shared-message ${m.role}`}>
              <strong>{m.role === "user" ? "你" : "助手"}</strong>
              {m.createdAt && <span className="shared-message-time">{new Date(m.createdAt).toLocaleString("zh-CN")}</span>}
              <div className="shared-message-content">{m.content}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SharedRoute() {
  const shared: SharedConversation | null = (() => {
    const match = window.location.hash.match(/^#share\/([a-f0-9]+)$/);
    if (match) {
      return getSharedConversation(match[1]);
    }
    return null;
  })();

  if (!shared) {
    return (
      <div className="shared-route-not-found">
        <h1>链接无效或已过期</h1>
        <p>该分享链接可能已被删除或链接错误。</p>
        <a href="/" className="primary-button">返回首页</a>
      </div>
    );
  }

  return <SharedViewer shared={shared} onClose={() => { window.location.hash = ""; }} />;
}
