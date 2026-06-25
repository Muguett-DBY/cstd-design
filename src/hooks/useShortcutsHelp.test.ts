import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useShortcutsHelp } from "./useShortcutsHelp";

describe("useShortcutsHelp", () => {
  test("starts with shortcuts panel closed", () => {
    const { result } = renderHook(() => useShortcutsHelp());
    expect(result.current.open).toBe(false);
  });

  test("setOpen opens the panel", () => {
    const { result } = renderHook(() => useShortcutsHelp());
    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);
  });

  test("setOpen closes the panel", () => {
    const { result } = renderHook(() => useShortcutsHelp());
    act(() => result.current.setOpen(true));
    act(() => result.current.setOpen(false));
    expect(result.current.open).toBe(false);
  });
});
