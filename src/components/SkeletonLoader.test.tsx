import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SkeletonLoader, SkeletonCard, SkeletonMessage } from "./SkeletonLoader";

describe("SkeletonLoader", () => {
  it("renders a single skeleton element", () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.querySelector(".skeleton-loader")).toBeTruthy();
  });

  it("renders multiple lines when lines prop > 1", () => {
    const { container } = render(<SkeletonLoader lines={3} />);
    expect(container.querySelector(".skeleton-group")).toBeTruthy();
    expect(container.querySelectorAll(".skeleton-loader")).toHaveLength(3);
  });

  it("sets custom width and height", () => {
    const { container } = render(<SkeletonLoader width={200} height={40} />);
    const el = container.querySelector(".skeleton-loader") as HTMLElement;
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("40px");
  });
});

describe("SkeletonCard", () => {
  it("renders a skeleton card", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector(".skeleton-card")).toBeTruthy();
    expect(container.querySelector(".skeleton-card-body")).toBeTruthy();
  });
});

describe("SkeletonMessage", () => {
  it("renders a skeleton message", () => {
    const { container } = render(<SkeletonMessage />);
    expect(container.querySelector(".skeleton-message")).toBeTruthy();
    expect(container.querySelector(".skeleton-message-body")).toBeTruthy();
  });
});
