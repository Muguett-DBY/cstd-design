import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  beforeEach(() => {
    if (!HTMLDialogElement.prototype.showModal) {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, writable: true, value: vi.fn() });
    }
    if (!HTMLDialogElement.prototype.close) {
      Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, writable: true, value: vi.fn() });
    }
    vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function showModal(this: HTMLDialogElement) {
      Object.defineProperty(this, "open", { configurable: true, value: true });
      this.setAttribute("open", "");
    });
    vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function close(this: HTMLDialogElement) {
      Object.defineProperty(this, "open", { configurable: true, value: false });
      this.removeAttribute("open");
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("exposes its title and message to assistive technology", () => {
    render(
      <ConfirmDialog
        open
        title="合并会话"
        message="确认将源会话合并到目标会话。"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "合并会话" });
    const descriptionId = dialog.getAttribute("aria-describedby");

    expect(descriptionId).toBeTruthy();
    expect(descriptionId ? document.getElementById(descriptionId)?.textContent : "").toBe("确认将源会话合并到目标会话。");
  });
});
