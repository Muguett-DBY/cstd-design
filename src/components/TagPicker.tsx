import { useState } from "react";
import { Plus, X } from "lucide-react";

export function TagPicker({
  assetId,
  onClose,
  onTagAdded,
  onTagRemoved,
  getTags,
  allTags,
  addTag,
  removeTag,
}: {
  assetId: string;
  onClose: () => void;
  onTagAdded?: (tag: string) => void;
  onTagRemoved?: (tag: string) => void;
  getTags: (assetId: string) => string[];
  allTags: () => string[];
  addTag: (assetId: string, tag: string) => void;
  removeTag: (assetId: string, tag: string) => void;
}) {
  const [input, setInput] = useState("");
  const current = getTags(assetId);
  const suggestions = allTags().filter((t) => !current.includes(t));

  const handleAdd = (tag: string) => {
    addTag(assetId, tag);
    onTagAdded?.(tag);
    setInput("");
  };

  return (
    <div className="tag-picker" role="dialog" aria-label="标签编辑器">
      <div className="tag-picker-header">
        <strong>标签</strong>
        <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
          <X size={14} />
        </button>
      </div>
      <div className="tag-picker-current">
        {current.length === 0 && <span className="tag-picker-empty">暂无标签</span>}
        {current.map((tag) => (
          <span key={tag} className="tag-chip removable">
            {tag}
            <button
              type="button"
              className="tag-chip-remove"
              onClick={() => { removeTag(assetId, tag); onTagRemoved?.(tag); }}
              aria-label={`删除标签 ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <form
        className="tag-picker-input"
        onSubmit={(e) => { e.preventDefault(); if (input.trim()) handleAdd(input); }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入新标签..."
          aria-label="新标签"
          maxLength={32}
        />
        <button type="submit" className="icon-button" disabled={!input.trim()} aria-label="添加标签">
          <Plus size={14} />
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="tag-picker-suggestions">
          <span className="tag-picker-label">建议：</span>
          {suggestions.slice(0, 8).map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip clickable"
              onClick={() => handleAdd(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
