import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { MobileBottomNav } from "./MobileBottomNav";

describe("MobileBottomNav", () => {
  afterEach(() => cleanup());

  test("uses custom workspace labels and exposes the current destination", () => {
    const onTabChange = vi.fn();
    render(
      <MobileBottomNav
        activeTab="image"
        onTabChange={onTabChange}
        onOpenSidebar={vi.fn()}
        customLabels={{ chat: "灵感", image: "画布", video: "", assets: "" }}
      />,
    );

    expect(screen.getByRole("button", { name: "前往灵感工作区" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "当前工作区：画布" }).getAttribute("aria-current")).toBe("page");

    fireEvent.click(screen.getByRole("button", { name: "前往视频工作区" }));
    expect(onTabChange).toHaveBeenCalledWith("video");
  });
});
