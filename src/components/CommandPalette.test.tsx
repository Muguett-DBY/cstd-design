import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CommandPalette, type CommandItem } from "./CommandPalette";

const recentCommandsKey = "cstd-design:commandPaletteRecent:v1";
const storage = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  },
  configurable: true,
});

afterEach(() => {
  storage.clear();
  cleanup();
});

function renderPalette(items: CommandItem[]) {
  return render(
    <CommandPalette
      open
      onClose={vi.fn()}
      items={items}
    />,
  );
}

describe("CommandPalette", () => {
  test("finds a command by an alias that is absent from its visible copy", () => {
    renderPalette([
      {
        id: "settings",
        label: "偏好设置",
        description: "默认尺寸、风格、帧率等",
        icon: Search,
        group: "action",
        keywords: ["settings", "preferences"],
        perform: vi.fn(),
      },
    ]);

    fireEvent.change(screen.getByRole("textbox", { name: "命令搜索" }), {
      target: { value: "settings" },
    });

    expect(screen.getByRole("option", { name: /偏好设置/ })).toBeTruthy();
  });

  test("finds a command by its description", () => {
    renderPalette([
      {
        id: "settings",
        label: "偏好设置",
        description: "默认尺寸、风格、帧率等",
        icon: Search,
        group: "action",
        perform: vi.fn(),
      },
    ]);

    fireEvent.change(screen.getByRole("textbox", { name: "命令搜索" }), {
      target: { value: "帧率" },
    });

    expect(screen.getByRole("option", { name: /偏好设置/ })).toBeTruthy();
  });

  test("executes the first result after a query replaces the result set", () => {
    const first = vi.fn();
    const second = vi.fn();
    const third = vi.fn();
    renderPalette([
      { id: "first", label: "First", icon: Search, group: "action", perform: first },
      { id: "second", label: "Second", icon: Search, group: "action", perform: second },
      { id: "third", label: "Third", icon: Search, group: "action", perform: third },
    ]);
    const input = screen.getByRole("textbox", { name: "命令搜索" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });

    fireEvent.change(input, { target: { value: "Second" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
    expect(third).not.toHaveBeenCalled();
  });

  test("reports the result count and current keyboard position", () => {
    renderPalette([
      { id: "first", label: "First", icon: Search, group: "navigation", perform: vi.fn() },
      { id: "second", label: "Second", icon: Search, group: "action", perform: vi.fn() },
    ]);
    const input = screen.getByRole("textbox", { name: "命令搜索" });

    expect(screen.getByText("共 2 个命令")).toBeTruthy();
    expect(screen.getByText("当前 1/2")).toBeTruthy();

    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(screen.getByText("当前 2/2")).toBeTruthy();
  });

  test("promotes the most recently executed command on the next open", () => {
    const first = vi.fn();
    const second = vi.fn();
    const items: CommandItem[] = [
      { id: "first", label: "First", icon: Search, group: "navigation", perform: first },
      { id: "second", label: "Second", icon: Search, group: "action", perform: second },
    ];

    const { unmount } = renderPalette(items);
    fireEvent.click(screen.getByRole("option", { name: /Second/ }));

    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(recentCommandsKey) ?? "[]")).toEqual(["second"]);

    unmount();
    renderPalette(items);

    expect(screen.getByText("最近使用")).toBeTruthy();
    expect(screen.getAllByRole("option")[0].textContent).toContain("Second");
    expect(screen.getAllByRole("option", { name: /Second/ })).toHaveLength(1);
  });

  test("ignores duplicate and stale recent command ids loaded from storage", () => {
    storage.set(recentCommandsKey, JSON.stringify(["second", "missing", "second", "first"]));

    renderPalette([
      { id: "first", label: "First", icon: Search, group: "navigation", perform: vi.fn() },
      { id: "second", label: "Second", icon: Search, group: "action", perform: vi.fn() },
    ]);

    expect(screen.getByText("最近使用")).toBeTruthy();
    expect(screen.getAllByRole("option")[0].textContent).toContain("Second");
    expect(screen.getAllByRole("option")[1].textContent).toContain("First");
    expect(screen.getAllByRole("option", { name: /Second/ })).toHaveLength(1);
    expect(screen.getAllByRole("option", { name: /First/ })).toHaveLength(1);
    expect(screen.queryByText("missing")).toBeNull();
  });
});
