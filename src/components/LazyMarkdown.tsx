import { lazy, Suspense } from "react";
import type { MarkdownProps } from "./Markdown";

const MarkdownRenderer = lazy(() => import("./Markdown").then((module) => ({ default: module.Markdown })));

function LazyMarkdown(props: MarkdownProps) {
  return (
    <Suspense fallback={<div className="markdown markdown-loading">正在渲染内容…</div>}>
      <MarkdownRenderer {...props} />
    </Suspense>
  );
}

export { LazyMarkdown };
