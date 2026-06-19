import { useState } from "react";
import { Folder, Plus, Trash2, X } from "lucide-react";
import type { AssetCollection } from "../hooks/useCollections";

export function CollectionPicker({
  assetId,
  collections,
  onCreate,
  onAdd,
  onRemove,
  onClose,
}: {
  assetId: string;
  collections: AssetCollection[];
  onCreate: (name: string) => AssetCollection | null;
  onAdd: (collectionId: string, assetId: string) => void;
  onRemove: (collectionId: string, assetId: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const assigned = collections.filter((c) => c.assetIds.includes(assetId));
  const unassigned = collections.filter((c) => !c.assetIds.includes(assetId));

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const result = onCreate(name);
    if (result) {
      onAdd(result.id, assetId);
      setNewName("");
    }
  };

  return (
    <div className="collection-picker" role="dialog" aria-label="收藏到集合">
      <div className="collection-picker-header">
        <strong><Folder size={14} /> 收藏到集合</strong>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
          <X size={14} />
        </button>
      </div>
      <div className="collection-picker-create">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          placeholder="新集合名称..."
          maxLength={32}
        />
        <button type="button" className="icon-button" onClick={handleCreate} disabled={!newName.trim()} aria-label="创建集合">
          <Plus size={14} />
        </button>
      </div>
      <div className="collection-picker-list">
        {assigned.length > 0 && (
          <div className="collection-picker-section">
            <span className="collection-picker-label">已收藏 ({assigned.length})</span>
            {assigned.map((c) => (
              <div key={c.id} className="collection-picker-item assigned">
                <Folder size={12} />
                <span>{c.name}</span>
                <button
                  type="button"
                  className="collection-picker-action"
                  onClick={() => onRemove(c.id, assetId)}
                  aria-label={`从 ${c.name} 移除`}
                  title="移除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        {unassigned.length > 0 && (
          <div className="collection-picker-section">
            <span className="collection-picker-label">其他集合</span>
            {unassigned.map((c) => (
              <div key={c.id} className="collection-picker-item">
                <Folder size={12} />
                <span>{c.name}</span>
                <button
                  type="button"
                  className="collection-picker-action add"
                  onClick={() => onAdd(c.id, assetId)}
                  aria-label={`添加到 ${c.name}`}
                  title="添加"
                >
                  <Plus size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        {collections.length === 0 && (
          <p className="collection-picker-empty">还没有集合。在上方输入名称创建第一个。</p>
        )}
      </div>
    </div>
  );
}
