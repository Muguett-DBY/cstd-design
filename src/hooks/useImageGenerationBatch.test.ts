import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useImageGenerationBatch } from "./useImageGenerationBatch";

describe("useImageGenerationBatch", () => {
  test("retains recipe and exposes only failed slots for retry", () => {
    const { result } = renderHook(() => useImageGenerationBatch());
    const recipe = { prompt: "mountain", style: "oil", size: "1024x1024" as const, referenceIds: ["a"], count: 3 };

    act(() => result.current.start(recipe));
    act(() => result.current.settle([
      { status: "fulfilled", filename: "one.png" },
      { status: "rejected", error: "timeout" },
      { status: "fulfilled", filename: "three.png" },
    ]));

    expect(result.current.summary).toMatchObject({ successCount: 2, failedCount: 1, recipe });
    expect(result.current.retryableIndexes).toEqual([1]);
  });

  test("clears retry state after all slots succeed", () => {
    const { result } = renderHook(() => useImageGenerationBatch());
    act(() => result.current.start({ prompt: "x", style: "none", size: "1024x768", referenceIds: [], count: 1 }));
    act(() => result.current.settle([{ status: "fulfilled", filename: "ok.png" }]));
    expect(result.current.retryableIndexes).toEqual([]);
    act(() => result.current.clear());
    expect(result.current.summary).toBeNull();
  });
});
