import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const parts = useMemo(() => {
    if (!query.trim()) return [{ text, highlight: false }];

    const q = query.toLowerCase();
    const result: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;
    const lowerText = text.toLowerCase();

    let index = lowerText.indexOf(q);
    while (index !== -1) {
      if (index > lastIndex) {
        result.push({ text: text.slice(lastIndex, index), highlight: false });
      }
      result.push({ text: text.slice(index, index + query.length), highlight: true });
      lastIndex = index + query.length;
      index = lowerText.indexOf(q, lastIndex);
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), highlight: false });
    }

    return result.length > 0 ? result : [{ text, highlight: false }];
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="search-highlight">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
