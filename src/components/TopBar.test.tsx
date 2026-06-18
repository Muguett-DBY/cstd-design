import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TopBar } from "./TopBar";

describe("TopBar", () => {
  test("exposes workspace navigation with current tab state", () => {
    render(<TopBar activeTab="chat" onTabChange={vi.fn()} onOpenSidebar={vi.fn()} />);

    const nav = screen.getByRole("navigation", { name: "工作区切换" });
    const active = screen.getByRole("button", { name: /咨询/ });

    expect(nav).toBeTruthy();
    expect(active.getAttribute("aria-current")).toBe("page");
  });
});
