import { useCustomShortcuts, type ShortcutAction } from "../hooks/useCustomShortcuts";

export function ShortcutHint({ action }: { action: ShortcutAction }) {
  const { format } = useCustomShortcuts();
  return (
    <kbd className="shortcut-hint">
      {format(action)}
    </kbd>
  );
}
