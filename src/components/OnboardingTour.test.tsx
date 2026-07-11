import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BACKUP_KEYS, ONBOARDING_STORAGE_KEY } from "../storage-keys";
import { OnboardingTour } from "./OnboardingTour";

describe("OnboardingTour", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
      },
      configurable: true,
    });

    if (!HTMLDialogElement.prototype.showModal) {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, writable: true, value: vi.fn() });
    }
    vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function showModal(this: HTMLDialogElement) {
      Object.defineProperty(this, "open", { configurable: true, value: true });
      this.setAttribute("open", "");
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("opens a labelled native modal with readable step progress", () => {
    render(<OnboardingTour />);

    const dialog = screen.getByRole("dialog", { name: "欢迎使用" });
    const descriptionId = dialog.getAttribute("aria-describedby");

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    expect(descriptionId).toBeTruthy();
    expect(descriptionId ? document.getElementById(descriptionId)?.textContent : "").toContain("私人 AI 创作工作台");
    expect(screen.getByText("第 1/7 步")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "下一步" }));
  });

  test("supports forward and backward keyboard navigation", () => {
    render(<OnboardingTour />);

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });

    expect(screen.getByRole("heading", { name: "命令面板" })).toBeTruthy();
    expect(screen.getByText("第 2/7 步")).toBeTruthy();

    fireEvent.keyDown(dialog, { key: "ArrowLeft" });

    expect(screen.getByRole("heading", { name: "欢迎使用" })).toBeTruthy();
    expect(screen.getByText("第 1/7 步")).toBeTruthy();
  });

  test("persists completion when the native dialog is cancelled", () => {
    render(<OnboardingTour />);

    const dialog = screen.getByRole("dialog");
    const cancelEvent = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancelEvent);

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("locks document scrolling only while the modal is open", async () => {
    document.body.style.overflow = "auto";
    render(<OnboardingTour />);

    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.click(screen.getByRole("button", { name: "跳过引导" }));

    expect(document.body.style.overflow).toBe("auto");
  });

  test("uses the same storage key for completion and backup", async () => {
    render(<OnboardingTour />);

    await userEvent.click(screen.getByRole("button", { name: "跳过引导" }));

    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
    expect(BACKUP_KEYS).toContain(ONBOARDING_STORAGE_KEY);
    expect(BACKUP_KEYS).not.toContain("cstd-design:onboarding-completed");
  });
});
