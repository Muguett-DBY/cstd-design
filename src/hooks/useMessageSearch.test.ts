import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import type { ChatMessage } from "../types";
import { useMessageSearch } from "./useMessageSearch";

describe("useMessageSearch", () => {
  test("focuses the result that belongs to an exact message", () => {
    const messages: ChatMessage[] = [
      {
        id: "first-message",
        role: "user",
        content: "Checklist draft",
        status: "complete",
      },
      {
        id: "target-message",
        role: "assistant",
        content: "Checklist approved",
        status: "complete",
      },
    ];
    const { result } = renderHook(() => useMessageSearch(messages));

    act(() => result.current.setQuery("checklist"));
    expect(result.current.totalResults).toBe(2);

    act(() => result.current.focusResult("target-message"));
    expect(result.current.activeResult?.messageId).toBe("target-message");
  });
});
