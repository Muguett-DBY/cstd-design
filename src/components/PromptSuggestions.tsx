import { useState } from "react";
import { Sparkles } from "lucide-react";
import { getRandomStarters, getContextualFollowups } from "../hooks/promptSuggestions";

export function PromptSuggestions({
  onSelect,
  showFollowups = true,
}: {
  onSelect: (text: string) => void;
  showFollowups?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const starters = getRandomStarters(4);
  const followups = getContextualFollowups();

  return (
    <div className="prompt-suggestions" role="region" aria-label="提示词建议">
      <div className="prompt-suggestions-label">
        <Sparkles size={12} /> 试试这些问题
      </div>
      <div className="prompt-suggestions-grid">
        {starters.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="prompt-suggestion-chip"
            onClick={() => onSelect(s.text)}
          >
            <span className="prompt-suggestion-icon">{s.icon}</span>
            <span className="prompt-suggestion-text">{s.text}</span>
          </button>
        ))}
      </div>
      {showFollowups && (
        <>
          <div className="prompt-suggestions-label secondary">追问示例</div>
          <div className="prompt-suggestions-list">
            {(showAll ? followups : followups.slice(0, 3)).map((text, idx) => (
              <button
                key={idx}
                type="button"
                className="prompt-suggestion-link"
                onClick={() => onSelect(text)}
              >
                {text}
              </button>
            ))}
            {!showAll && followups.length > 3 && (
              <button type="button" className="prompt-suggestion-more" onClick={() => setShowAll(true)}>
                查看更多 ({followups.length - 3})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
