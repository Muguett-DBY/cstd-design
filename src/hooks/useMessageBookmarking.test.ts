import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { useMessageBookmarking } from "./useMessageBookmarking";

vi.mock("../api", () => ({
  api: {
    bookmarks: vi.fn(),
    addBookmark: vi.fn(),
    removeBookmark: vi.fn(),
  },
}));

describe("useMessageBookmarking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads bookmarks on mount", async () => {
    vi.mocked(api.bookmarks).mockResolvedValue({
      bookmarks: [
        { id: "b1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
        { id: "b2", messageId: "msg2", conversationId: "conv1", createdAt: "2026-01-02" },
      ],
    });

    const { result } = renderHook(() => useMessageBookmarking("conv1"));

    await waitFor(() => expect(result.current.isBookmarked("msg1")).toBe(true));
    expect(result.current.isBookmarked("msg2")).toBe(true);
    expect(result.current.isBookmarked("msg3")).toBe(false);
  });

  test("returns false when conversationId is null", () => {
    const { result } = renderHook(() => useMessageBookmarking(null));
    expect(result.current.isBookmarked("msg1")).toBe(false);
  });

  test("toggleBookmark adds bookmark optimistically", async () => {
    vi.mocked(api.bookmarks).mockResolvedValue({ bookmarks: [] });
    vi.mocked(api.addBookmark).mockResolvedValue({
      bookmark: { id: "b-new", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
    });

    const { result } = renderHook(() => useMessageBookmarking("conv1"));

    await waitFor(() => expect(api.bookmarks).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleBookmark("msg1");
    });

    expect(result.current.isBookmarked("msg1")).toBe(true);
    expect(api.addBookmark).toHaveBeenCalledWith("conv1", "msg1");
  });

  test("toggleBookmark removes bookmark optimistically", async () => {
    vi.mocked(api.bookmarks).mockResolvedValue({
      bookmarks: [
        { id: "b1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
      ],
    });
    vi.mocked(api.removeBookmark).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useMessageBookmarking("conv1"));

    await waitFor(() => expect(result.current.isBookmarked("msg1")).toBe(true));

    await act(async () => {
      await result.current.toggleBookmark("msg1");
    });

    expect(result.current.isBookmarked("msg1")).toBe(false);
    expect(api.removeBookmark).toHaveBeenCalledWith("b1");
  });

  test("toggleBookmark reverts on API failure (add)", async () => {
    vi.mocked(api.bookmarks).mockResolvedValue({ bookmarks: [] });
    vi.mocked(api.addBookmark).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useMessageBookmarking("conv1"));

    await waitFor(() => expect(api.bookmarks).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleBookmark("msg1");
    });

    expect(result.current.isBookmarked("msg1")).toBe(false);
  });

  test("toggleBookmark reverts on API failure (remove)", async () => {
    vi.mocked(api.bookmarks).mockResolvedValue({
      bookmarks: [
        { id: "b1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
      ],
    });
    vi.mocked(api.removeBookmark).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useMessageBookmarking("conv1"));

    await waitFor(() => expect(result.current.isBookmarked("msg1")).toBe(true));

    await act(async () => {
      await result.current.toggleBookmark("msg1");
    });

    expect(result.current.isBookmarked("msg1")).toBe(true);
  });

  test("getBookmarkedMessages filters correctly", async () => {
    vi.mocked(api.bookmarks).mockResolvedValue({
      bookmarks: [
        { id: "b1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
        { id: "b2", messageId: "msg3", conversationId: "conv1", createdAt: "2026-01-02" },
      ],
    });

    const { result } = renderHook(() => useMessageBookmarking("conv1"));

    await waitFor(() => expect(result.current.isBookmarked("msg1")).toBe(true));

    const filtered = result.current.getBookmarkedMessages(["msg1", "msg2", "msg3"]);
    expect(filtered).toEqual(["msg1", "msg3"]);
  });

  test("handles API load error gracefully", async () => {
    vi.mocked(api.bookmarks).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMessageBookmarking("conv1"));

    await waitFor(() => expect(api.bookmarks).toHaveBeenCalled());
    expect(result.current.isBookmarked("msg1")).toBe(false);
  });
});
