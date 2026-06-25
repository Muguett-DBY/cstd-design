import { lazy, Suspense, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

export type MarkdownProps = { content: string; highlightQuery?: string };

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

const MermaidBlock = lazy(() => import("./MermaidBlock").then((m) => ({ default: m.MermaidBlock })));

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

function Markdown({ content, highlightQuery }: MarkdownProps) {
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
              if (className?.includes("language-mermaid")) return <Suspense fallback={<pre className="mermaid-fallback">{text}</pre>}><MermaidBlock source={text} /></Suspense>;
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

export { Markdown, CodeSnippet };
