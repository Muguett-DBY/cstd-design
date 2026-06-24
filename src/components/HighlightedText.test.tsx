import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HighlightedText } from "./HighlightedText";

describe("HighlightedText", () => {
  it("renders text without highlights when query is empty", () => {
    const { container } = render(<HighlightedText text="hello world" query="" />);
    expect(container.querySelector("mark")).toBeFalsy();
    expect(container.textContent).toBe("hello world");
  });

  it("highlights matching text", () => {
    render(<HighlightedText text="hello world hello" query="hello" />);
    const marks = document.querySelectorAll("mark");
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe("hello");
  });

  it("highlights with different case", () => {
    const { container } = render(<HighlightedText text="Hello World" query="world" />);
    const marks = container.querySelectorAll("mark");
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe("World");
  });

  it("returns full text when no match", () => {
    const { container } = render(<HighlightedText text="hello world" query="xyz" />);
    expect(container.querySelector("mark")).toBeFalsy();
    expect(container.textContent).toBe("hello world");
  });
});
