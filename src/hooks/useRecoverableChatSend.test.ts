import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useRecoverableChatSend } from "./useRecoverableChatSend";

describe("useRecoverableChatSend", () => {
  test("keeps failed content available for restoration and retry", () => {
    const { result } = renderHook(() => useRecoverableChatSend());

    act(() => result.current.begin("important prompt", "parent-1"));
    act(() => result.current.fail("network unavailable"));

    expect(result.current.failed).toEqual({
      content: "important prompt",
      parentId: "parent-1",
      error: "network unavailable",
    });
    expect(result.current.restore("")).toEqual(result.current.failed);
    expect(result.current.restore("newer draft")).toBeNull();
  });

  test("success and dismiss clear recoverable state", () => {
    const { result } = renderHook(() => useRecoverableChatSend());
    act(() => result.current.begin("hello", null));
    act(() => result.current.fail("failed"));
    act(() => result.current.dismiss());
    expect(result.current.failed).toBeNull();

    act(() => result.current.begin("again", null));
    act(() => result.current.succeed());
    expect(result.current.pending).toBeNull();
    expect(result.current.failed).toBeNull();
  });
});
