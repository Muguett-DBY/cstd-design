import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ShortcutEntry {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ["Cmd/Ctrl", "K"], description: "打开命令面板", category: "全局" },
  { keys: ["Cmd/Ctrl", "/"], description: "查看快捷键", category: "全局" },
  { keys: ["Cmd/Ctrl", "F"], description: "搜索消息", category: "全局" },
  { keys: ["Cmd/Ctrl", "N"], description: "新建对话", category: "全局" },
  { keys: ["Esc"], description: "关闭弹窗", category: "全局" },
  { keys: ["↑", "↓"], description: "命令面板中导航", category: "命令面板" },
  { keys: ["Enter"], description: "执行命令", category: "命令面板" },
  { keys: ["Esc"], description: "关闭命令面板", category: "命令面板" },
  { keys: ["←", "→"], description: "浏览消息", category: "预览" },
  { keys: ["Home"], description: "跳到第一张", category: "预览" },
  { keys: ["End"], description: "跳到最后一张", category: "预览" },
  { keys: ["+", "-"], description: "放大/缩小", category: "预览" },
  { keys: ["0"], description: "重置缩放", category: "预览" },
  { keys: ["I"], description: "切换信息面板", category: "预览" },
  { keys: ["Enter"], description: "发送消息", category: "聊天" },
  { keys: ["Shift", "Enter"], description: "在输入框中换行", category: "聊天" },
  { keys: ["Enter"], description: "下一个搜索结果", category: "搜索" },
  { keys: ["Shift", "Enter"], description: "上一个搜索结果", category: "搜索" },
];

function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

function formatKeys(keys: string[]): string[] {
  if (!isMac()) return keys;
  return keys.map((k) => {
    if (k === "Cmd/Ctrl") return "⌘";
    if (k === "Cmd") return "⌘";
    if (k === "Shift") return "⇧";
    if (k === "Alt") return "⌥";
    return k;
  });
}

export function KeyboardShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = filter.trim()
    ? SHORTCUTS.filter((s) => {
        const q = filter.toLowerCase();
        return s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      })
    : SHORTCUTS;

  const grouped: Record<string, ShortcutEntry[]> = {};
  for (const s of filtered) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <div className="shortcuts-help-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="键盘快捷键">
      <div className="shortcuts-help" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-help-header">
          <h3>键盘快捷键</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <input
          type="text"
          placeholder="筛选..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="shortcuts-help-filter"
          aria-label="筛选快捷键"
        />
        <div className="shortcuts-help-content">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="shortcuts-help-group">
              <h4>{category}</h4>
              {items.map((item, idx) => (
                <div key={idx} className="shortcuts-help-row">
                  <span className="shortcuts-help-desc">{item.description}</span>
                  <span className="shortcuts-help-keys">
                    {formatKeys(item.keys).map((k, i) => (
                      <kbd key={i}>{k}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="shortcuts-help-footer">
          按 <kbd>Esc</kbd> 关闭
        </div>
      </div>
    </div>
  );
}

