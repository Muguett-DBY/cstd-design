import { useState } from "react";
import { Folder, FolderPlus, Trash2, X } from "lucide-react";
import type { AssetCollection } from "../hooks/useCollections";

export function CollectionsManager({
  open,
  onClose,
  collections,
  onCreate,
  onRemove,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  collections: AssetCollection[];
  onCreate: (name: string) => AssetCollection | null;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AssetCollection>) => void;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!open) return null;

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName("");
  };

  const startEdit = (c: AssetCollection) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdate(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="collections-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="集合管理">
      <div className="collections-modal" onClick={(e) => e.stopPropagation()}>
        <div className="collections-modal-header">
          <h3><Folder size={16} /> 集合管理</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="collections-modal-create">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="新集合名称..."
            maxLength={32}
          />
          <button type="button" className="primary-button" onClick={handleCreate} disabled={!newName.trim()}>
            <FolderPlus size={14} /> 创建
          </button>
        </div>
        <div className="collections-modal-list">
          {collections.length === 0 ? (
            <p className="collections-modal-empty">还没有集合。创建第一个来开始组织资产。</p>
          ) : (
            collections.map((c) => (
              <div key={c.id} className="collection-item">
                <Folder size={16} className="collection-item-icon" />
                {editingId === c.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="collection-item-edit-input"
                      autoFocus
                    />
                    <button type="button" className="ghost-button-small" onClick={saveEdit}>保存</button>
                    <button type="button" className="ghost-button-small" onClick={() => setEditingId(null)}>取消</button>
                  </>
                ) : (
                  <>
                    <div className="collection-item-content">
                      <strong>{c.name}</strong>
                      <span className="collection-item-meta">{c.assetIds.length} 个资产 · {new Date(c.createdAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <div className="collection-item-actions">
                      <button type="button" className="ghost-button-small" onClick={() => startEdit(c)}>重命名</button>
                      <button
                        type="button"
                        className="collection-item-remove"
                        onClick={() => onRemove(c.id)}
                        aria-label={`删除 ${c.name}`}
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
