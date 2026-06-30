import { useCallback, useMemo, useState } from "react";
import { isPlainRecord, parseStoredJson } from "../utils/storageJson";

const STORAGE_KEY = "cstd-design:custom-shortcuts";

export type ShortcutAction =
  | "commandPalette"
  | "newConversation"
  | "search"
  | "toggleSidebar"
  | "togglePanel"
  | "send"
  | "focusInput";

export type ShortcutMap = Record<ShortcutAction, string>;

const DEFAULT_SHORTCUTS: ShortcutMap = {
  commandPalette: "Mod+k",
  newConversation: "Mod+n",
  search: "Mod+Shift+f",
  toggleSidebar: "Mod+b",
  togglePanel: "Mod+.",
  send: "Enter",
  focusInput: "Mod+/",
};

const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  commandPalette: "命令面板",
  newConversation: "新建对话",
  search: "全局搜索",
  toggleSidebar: "切换侧边栏",
  togglePanel: "切换面板",
  send: "发送消息",
  focusInput: "聚焦输入框",
} as const;

function isShortcutAction(value: string): value is ShortcutAction {
  return value in DEFAULT_SHORTCUTS;
}

function loadCustomShortcuts(): Partial<ShortcutMap> {
  const parsed = parseStoredJson(localStorage.getItem(STORAGE_KEY), {}, isPlainRecord);
  const shortcuts: Partial<ShortcutMap> = {};
  for (const [action, shortcut] of Object.entries(parsed)) {
    if (isShortcutAction(action) && typeof shortcut === "string") {
      shortcuts[action] = shortcut;
    }
  }
  return shortcuts;
}

function saveCustomShortcuts(shortcuts: Partial<ShortcutMap>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch {
    // ignore
  }
}

function formatShortcut(shortcut: string): string {
  return shortcut
    .replace("Mod", navigator.platform.includes("Mac") ? "⌘" : "Ctrl")
    .replace("Shift", "⇧")
    .replace("Alt", "⌥")
    .replace("+", " + ");
}

export function useCustomShortcuts() {
  const [customShortcuts, setCustomShortcuts] = useState<Partial<ShortcutMap>>(loadCustomShortcuts);

  const shortcuts = useMemo(() => ({ ...DEFAULT_SHORTCUTS, ...customShortcuts }), [customShortcuts]);

  const updateShortcut = useCallback((action: ShortcutAction, shortcut: string) => {
    setCustomShortcuts((prev) => {
      const next = { ...prev, [action]: shortcut };
      saveCustomShortcuts(next);
      return next;
    });
  }, []);

  const resetShortcuts = useCallback(() => {
    setCustomShortcuts({});
    saveCustomShortcuts({});
  }, []);

  const format = useCallback((action: ShortcutAction): string => {
    return formatShortcut(shortcuts[action]);
  }, [shortcuts]);

  return { shortcuts: shortcuts as ShortcutMap, updateShortcut, resetShortcuts, format, labels: SHORTCUT_LABELS };
}
