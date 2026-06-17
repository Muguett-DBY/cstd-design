import { useState, useRef } from "react";

export function ConversationTitleInput({ title, disabled, onCommit }: { title: string; disabled: boolean; onCommit: (title: string) => Promise<void> }) {
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const commit = async () => {
    const nextTitle = draft.trim();
    if (!nextTitle) {
      setDraft(title);
      return;
    }
    await onCommit(nextTitle);
  };
  return (
    <input
      ref={inputRef}
      className="title-input"
      value={draft}
      maxLength={80}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          inputRef.current?.blur();
        }
      }}
      disabled={disabled}
    />
  );
}
