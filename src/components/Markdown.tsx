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

function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export { Markdown, CodeSnippet, MermaidBlock };
