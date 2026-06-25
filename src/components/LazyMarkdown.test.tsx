import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LazyMarkdown } from "./LazyMarkdown";

describe("LazyMarkdown", () => {
  test("shows a lightweight fallback before rendering markdown content", async () => {
    render(<LazyMarkdown content="**延迟加载内容**" />);

    expect(screen.getByText("正在渲染内容…")).toBeTruthy();
    expect(await screen.findByText("延迟加载内容", undefined, { timeout: 5000 })).toBeTruthy();
  }, 15000);
});
