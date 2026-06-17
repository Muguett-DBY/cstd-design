import { useId, useEffect, useState } from "react";

export function MermaidBlock({ source }: { source: string }) {
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
