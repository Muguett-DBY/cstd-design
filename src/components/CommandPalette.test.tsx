import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CommandPalette, type CommandItem } from "./CommandPalette";

afterEach(() => cleanup());

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
});
