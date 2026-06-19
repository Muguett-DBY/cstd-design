import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TopBar } from "./TopBar";

describe("TopBar", () => {
  test("exposes workspace navigation with current tab state", () => {
    const t = (key: string) => {
      const map: Record<string, string> = {
        "nav.chat": "Chat",
        "nav.image": "Image",
        "nav.video": "Video",
        "nav.assets": "Assets",
        "topbar.chatDesc": "Ask quietly, answer clearly.",
        "topbar.imageDesc": "Describe your idea, generate an image.",
        "topbar.videoDesc": "Keep this page open while the video generates.",
        "topbar.assetsDesc": "Manage your uploads and creations.",
      };
      return map[key] || key;
    };
    render(<TopBar activeTab="chat" onTabChange={vi.fn()} onOpenSidebar={vi.fn()} t={t as never} customLabels={{ chat: "", image: "", video: "", assets: "" }} />);

    const nav = screen.getByRole("navigation", { name: /工作区切换|workspace/i });
    const active = screen.getByRole("button", { name: /Chat/i });

    expect(nav).toBeTruthy();
    expect(active.getAttribute("aria-current")).toBe("page");
  });
});
