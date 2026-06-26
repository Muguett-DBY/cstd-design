import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { BackupRestore } from "./BackupRestore";
import { EXPORT_PREFERENCES_STORAGE_KEY } from "../storage-keys";

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    length: 0,
    key: () => null,
  },
  configurable: true,
});

function backupFile(data: Record<string, unknown>) {
  return new File([
    JSON.stringify({
      version: 1,
      exportedAt: "2026-06-26T00:00:00.000Z",
      data,
    }),
  ], "backup.json", { type: "application/json" });
}

describe("BackupRestore", () => {
  beforeEach(() => storage.clear());
  afterEach(() => cleanup());

  test("labels backup preview items as new or overwriting existing settings", async () => {
    localStorage.setItem(EXPORT_PREFERENCES_STORAGE_KEY, JSON.stringify({ format: "pdf", template: "default" }));

    const { container } = render(<BackupRestore onNotice={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInstanceOf(HTMLInputElement);

    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [
          backupFile({
            [EXPORT_PREFERENCES_STORAGE_KEY]: { format: "markdown", template: "professional" },
            "cstd-design:theme": "neon",
          }),
        ],
      },
    });

    await waitFor(() => expect(screen.getByText("导出偏好")).toBeTruthy());
    expect(screen.getByText("主题")).toBeTruthy();
    expect(screen.getByText("将覆盖")).toBeTruthy();
    expect(screen.getByText("新增")).toBeTruthy();
  });

  test("reports imported and skipped counts for merge imports", async () => {
    localStorage.setItem(EXPORT_PREFERENCES_STORAGE_KEY, JSON.stringify({ format: "pdf", template: "default" }));
    const onNotice = vi.fn();

    const { container } = render(<BackupRestore onNotice={onNotice} />);
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [
          backupFile({
            [EXPORT_PREFERENCES_STORAGE_KEY]: { format: "markdown", template: "professional" },
            "cstd-design:theme": "neon",
          }),
        ],
      },
    });

    await waitFor(() => expect(screen.getByText("导出偏好")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "合并导入（保留现有）" }));

    expect(onNotice).toHaveBeenCalledWith("已导入 1 项设置，跳过 1 项已有设置（合并模式），请刷新页面。");
    expect(localStorage.getItem(EXPORT_PREFERENCES_STORAGE_KEY)).toBe(JSON.stringify({ format: "pdf", template: "default" }));
    expect(localStorage.getItem("cstd-design:theme")).toBe("neon");
  });

  test("summarizes backup import impact before confirmation", async () => {
    localStorage.setItem(EXPORT_PREFERENCES_STORAGE_KEY, JSON.stringify({ format: "pdf", template: "default" }));

    const { container } = render(<BackupRestore onNotice={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [
          backupFile({
            [EXPORT_PREFERENCES_STORAGE_KEY]: { format: "markdown", template: "professional" },
            "cstd-design:theme": "neon",
          }),
        ],
      },
    });

    expect(await screen.findByText("导入影响：1 项将覆盖，1 项新增。")).toBeTruthy();
    expect(screen.getByText("合并导入会跳过已有设置；覆盖导入会替换已有设置。")).toBeTruthy();
  });

  test("warns when a backup contains unsupported keys that will be ignored", async () => {
    const { container } = render(<BackupRestore onNotice={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [
          backupFile({
            "cstd-design:theme": "neon",
            "other-app:token": "not-imported",
          }),
        ],
      },
    });

    expect(await screen.findByText("将忽略 1 项不支持数据。")).toBeTruthy();
    expect(screen.queryByText("other-app:token")).toBeNull();
  });

  test("blocks confirmation when a backup has no supported settings", async () => {
    const { container } = render(<BackupRestore onNotice={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput as HTMLInputElement, {
      target: {
        files: [
          backupFile({
            "other-app:token": "not-imported",
          }),
        ],
      },
    });

    expect(await screen.findByText("没有可导入的设置。")).toBeTruthy();
    expect((screen.getByRole("button", { name: "合并导入（保留现有）" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "覆盖导入" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
