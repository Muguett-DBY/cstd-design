import { useState } from "react";
import { Star, Search, Plus, Trash2, X, Clock } from "lucide-react";
import { usePromptLibrary } from "../hooks/usePromptLibrary";
import type { PromptCategory } from "../hooks/promptLibrary";

interface PromptLibraryProps {
  onSelect: (text: string) => void;
  onClose: () => void;
}

export function PromptLibrary({ onSelect, onClose }: PromptLibraryProps) {
  const {
    prompts,
    addPrompt,
    removePrompt,
    toggleFavorite,
    search,
    getFavorites,
    getRecentlyUsed,
    recordUsage,
    categories,
  } = usePromptLibrary();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all" | "favorites" | "recent">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState<PromptCategory>("custom");

  const filteredPrompts = (() => {
    if (query.trim()) return search(query);
    if (selectedCategory === "favorites") return getFavorites();
    if (selectedCategory === "recent") return getRecentlyUsed();
    if (selectedCategory === "all") return prompts;
    return prompts.filter((p) => p.category === selectedCategory);
  })();

  const recentlyUsed = getRecentlyUsed(5);

  const handleSelect = (id: string, text: string) => {
    recordUsage(id);
    onSelect(text);
    onClose();
  };

  const handleAdd = () => {
    if (newPromptText.trim()) {
      addPrompt(newPromptText.trim(), newPromptCategory);
      setNewPromptText("");
      setShowAddForm(false);
    }
  };

  return (
    <div className="prompt-library-overlay" onClick={onClose}>
      <div className="prompt-library" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-library-header">
          <h3>提示词库</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="prompt-library-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索提示词..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {recentlyUsed.length > 0 && !query.trim() && selectedCategory === "all" && (
          <div className="prompt-library-recent">
            <div className="prompt-library-recent-header">
              <Clock size={12} /> 最近使用
            </div>
            <div className="prompt-library-recent-list">
              {recentlyUsed.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  className="prompt-library-recent-item"
                  onClick={() => handleSelect(prompt.id, prompt.text)}
                  title={prompt.text}
                >
                  <span className="prompt-library-item-icon">{prompt.icon}</span>
                  <span className="prompt-library-recent-text">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="prompt-library-categories">
          <button
            type="button"
            className={`category-chip${selectedCategory === "all" ? " active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            全部 ({prompts.length})
          </button>
          <button
            type="button"
            className={`category-chip${selectedCategory === "favorites" ? " active" : ""}`}
            onClick={() => setSelectedCategory("favorites")}
          >
            <Star size={12} /> 收藏
          </button>
          {recentlyUsed.length > 0 && (
            <button
              type="button"
              className={`category-chip${selectedCategory === "recent" ? " active" : ""}`}
              onClick={() => setSelectedCategory("recent")}
            >
              <Clock size={12} /> 最近使用
            </button>
          )}
          {(Object.keys(categories) as PromptCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip${selectedCategory === cat ? " active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {(categories as Record<string, string>)[cat]}
            </button>
          ))}
        </div>

        <div className="prompt-library-list">
          {filteredPrompts.length === 0 ? (
            <div className="prompt-library-empty">
              {query ? "没有找到匹配的提示词" : "暂无提示词"}
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="prompt-library-item">
                <button
                  type="button"
                  className="prompt-library-item-text"
                  onClick={() => handleSelect(prompt.id, prompt.text)}
                >
                  <span className="prompt-library-item-icon">{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
                <div className="prompt-library-item-actions">
                  <button
                    type="button"
                    className={`icon-button${prompt.isFavorite ? " active" : ""}`}
                    onClick={() => toggleFavorite(prompt.id)}
                    aria-label={prompt.isFavorite ? "取消收藏" : "收藏"}
                  >
                    <Star size={14} fill={prompt.isFavorite ? "currentColor" : "none"} />
                  </button>
                  {prompt.id.startsWith("custom-") && (
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => removePrompt(prompt.id)}
                      aria-label="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="prompt-library-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} /> 添加自定义
          </button>
        </div>

        {showAddForm && (
          <div className="prompt-library-add-form">
            <input
              type="text"
              placeholder="输入新的提示词..."
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <select
              value={newPromptCategory}
              onChange={(e) => setNewPromptCategory(e.target.value as PromptCategory)}
            >
              {(Object.keys(categories) as PromptCategory[]).map((cat) => (
                <option key={cat} value={cat}>{(categories as Record<string, string>)[cat]}</option>
              ))}
            </select>
            <button
              type="button"
              className="primary-button"
              onClick={handleAdd}
              disabled={!newPromptText.trim()}
            >
              添加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
