import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { useMessageReactions } from "./useMessageReactions";

vi.mock("../api", () => ({
  api: {
    reactions: vi.fn(),
    toggleReaction: vi.fn(),
  },
}));

describe("useMessageReactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads reactions on mount", async () => {
    vi.mocked(api.reactions).mockResolvedValue({
      reactions: { msg1: ["👍", "❤️"], msg2: ["😊"] },
    });

    const { result } = renderHook(() => useMessageReactions("conv1"));

    await waitFor(() => expect(result.current.getReactions("msg1")).toEqual(["👍", "❤️"]));
    expect(result.current.getReactions("msg2")).toEqual(["😊"]);
    expect(result.current.getReactions("msg3")).toEqual([]);
  });

  test("returns empty reactions when conversationId is null", () => {
    const { result } = renderHook(() => useMessageReactions(null));
    expect(result.current.getReactions("msg1")).toEqual([]);
  });

  test("hasReaction returns true when emoji exists", async () => {
    vi.mocked(api.reactions).mockResolvedValue({
      reactions: { msg1: ["👍"] },
    });

    const { result } = renderHook(() => useMessageReactions("conv1"));

    await waitFor(() => expect(result.current.hasReaction("msg1", "👍")).toBe(true));
    expect(result.current.hasReaction("msg1", "❤️")).toBe(false);
  });

  test("toggleReaction adds emoji optimistically", async () => {
    vi.mocked(api.reactions).mockResolvedValue({ reactions: {} });
    vi.mocked(api.toggleReaction).mockResolvedValue({ status: "added" });

    const { result } = renderHook(() => useMessageReactions("conv1"));

    await waitFor(() => expect(api.reactions).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleReaction("msg1", "👍");
    });

    expect(result.current.getReactions("msg1")).toContain("👍");
    expect(api.toggleReaction).toHaveBeenCalledWith("conv1", "msg1", "👍");
  });

  test("toggleReaction removes emoji optimistically", async () => {
    vi.mocked(api.reactions).mockResolvedValue({
      reactions: { msg1: ["👍"] },
    });
    vi.mocked(api.toggleReaction).mockResolvedValue({ status: "removed" });

    const { result } = renderHook(() => useMessageReactions("conv1"));

    await waitFor(() => expect(result.current.getReactions("msg1")).toEqual(["👍"]));

    await act(async () => {
      await result.current.toggleReaction("msg1", "👍");
    });

    expect(result.current.getReactions("msg1")).not.toContain("👍");
  });

  test("toggleReaction reverts on API failure", async () => {
    vi.mocked(api.reactions).mockResolvedValue({ reactions: {} });
    vi.mocked(api.toggleReaction).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useMessageReactions("conv1"));

    await waitFor(() => expect(api.reactions).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleReaction("msg1", "👍");
    });

    expect(result.current.getReactions("msg1")).not.toContain("👍");
  });

  test("quickEmojis contains expected emojis", () => {
    const { result } = renderHook(() => useMessageReactions("conv1"));
    expect(result.current.quickEmojis).toEqual(["👍", "❤️", "😊", "🎉", "🤔", "👀"]);
  });

  test("handles API load error gracefully", async () => {
    vi.mocked(api.reactions).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMessageReactions("conv1"));

    await waitFor(() => expect(api.reactions).toHaveBeenCalled());
    expect(result.current.getReactions("msg1")).toEqual([]);
  });
});
