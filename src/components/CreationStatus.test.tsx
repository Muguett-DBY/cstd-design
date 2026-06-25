import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CreationStatus } from "./CreationStatus";

describe("CreationStatus", () => {
  test("announces recoverable errors and runs actions", () => {
    const retry = vi.fn();
    render(
      <CreationStatus
        status="error"
        title="生成失败"
        detail="网络中断"
        primaryAction={{ label: "重试", onClick: retry }}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("网络中断");
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  test("renders pending status as a polite live region", () => {
    render(<CreationStatus status="pending" title="处理中" detail="请稍候" />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });
});
