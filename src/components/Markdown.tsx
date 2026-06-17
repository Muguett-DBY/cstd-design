import { useId, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

function CodeSnippet({ className, code }: { className?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="code-snippet">
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? "已复制" : "复制代码"}
      </button>
      <code className={className}>{code}</code>
    </span>
  );
}

function MermaidBlock({ source }: { source: string }) {
  const [svg, setSvg] = useState("");
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    let cancelled = false;
    import("mermaid")
      .then(({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, theme: "base" });
        return mermaid.render(id, source);
      })
      .then((result) => {
        if (!cancelled) setSvg(result.svg);
      })
      .catch(() => {
        if (!cancelled) setSvg("");
      });
    return () => {
      cancelled = true;
    };
  }, [id, source]);
  if (!svg) return <pre className="mermaid-fallback">{source}</pre>;
  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function highlightText(text: string, query: string): React.ReactNode[] {
  if (!query.trim()) return [text];
  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  while (lastIndex < lowerText.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
    if (matchIndex === -1) {
      parts.push(text.slice(lastIndex));
      break;
    }
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }
    parts.push(
      <mark key={matchIndex} className="search-highlight">
        {text.slice(matchIndex, matchIndex + query.length)}
      </mark>
    );
    lastIndex = matchIndex + query.length;
  }

  return parts;
}

function Markdown({ content, highlightQuery }: { content: string; highlightQuery?: string }) {
  const highlighted = highlightQuery ? highlightText(content, highlightQuery) : content;
  return (
    <div className="markdown">
      {typeof highlighted === "string" ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
          components={{
            code({ className, children, ...props }) {
              const text = String(children).replace(/\n$/, "");
              if (className?.includes("language-mermaid")) return <MermaidBlock source={text} />;
              if (className?.startsWith("language-") || String(children).includes("\n")) return <CodeSnippet className={className} code={text} />;
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            a({ href, children, ...props }) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <div className="markdown-highlighted">{highlighted}</div>
      )}
    </div>
  );
}

export { Markdown, CodeSnippet, MermaidBlock };
