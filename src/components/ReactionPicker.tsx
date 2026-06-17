import { SmilePlus } from "lucide-react";

export function ReactionPicker({
  quickEmojis,
  onReact,
}: {
  quickEmojis: string[];
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="reaction-picker">
      <SmilePlus size={14} className="reaction-picker-icon" />
      <div className="reaction-picker-emojis">
        {quickEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="reaction-emoji-btn"
            onClick={() => onReact(emoji)}
            title={`添加 ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
