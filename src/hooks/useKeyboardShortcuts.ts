import { useEffect, useCallback } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
        const metaMatch = shortcut.meta ? event.metaKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    shortcuts.push(shortcut);
  }, [shortcuts]);

  return { registerShortcut };
}

export function getShortcutDisplay(shortcut: Shortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.meta) parts.push("⌘");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
}

export type { Shortcut };
