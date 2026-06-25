import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { useMessagePinning } from "./useMessagePinning";

vi.mock("../api", () => ({
  api: {
    pins: vi.fn(),
    addPin: vi.fn(),
    removePin: vi.fn(),
  },
}));

describe("useMessagePinning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads pins on mount", async () => {
    vi.mocked(api.pins).mockResolvedValue({
      pins: [
        { id: "p1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
        { id: "p2", messageId: "msg2", conversationId: "conv1", createdAt: "2026-01-02" },
      ],
    });

    const { result } = renderHook(() => useMessagePinning("conv1"));

    await waitFor(() => expect(result.current.isPinned("msg1")).toBe(true));
    expect(result.current.isPinned("msg2")).toBe(true);
    expect(result.current.isPinned("msg3")).toBe(false);
  });

  test("returns false when conversationId is null", () => {
    const { result } = renderHook(() => useMessagePinning(null));
    expect(result.current.isPinned("msg1")).toBe(false);
  });

  test("togglePin adds pin optimistically", async () => {
    vi.mocked(api.pins).mockResolvedValue({ pins: [] });
    vi.mocked(api.addPin).mockResolvedValue({
      pin: { id: "p-new", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
    });

    const { result } = renderHook(() => useMessagePinning("conv1"));

    await waitFor(() => expect(api.pins).toHaveBeenCalled());

    await act(async () => {
      await result.current.togglePin("msg1");
    });

    expect(result.current.isPinned("msg1")).toBe(true);
    expect(api.addPin).toHaveBeenCalledWith("conv1", "msg1");
  });

  test("togglePin removes pin optimistically", async () => {
    vi.mocked(api.pins).mockResolvedValue({
      pins: [
        { id: "p1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
      ],
    });
    vi.mocked(api.removePin).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useMessagePinning("conv1"));

    await waitFor(() => expect(result.current.isPinned("msg1")).toBe(true));

    await act(async () => {
      await result.current.togglePin("msg1");
    });

    expect(result.current.isPinned("msg1")).toBe(false);
    expect(api.removePin).toHaveBeenCalledWith("p1");
  });

  test("togglePin reverts on API failure (add)", async () => {
    vi.mocked(api.pins).mockResolvedValue({ pins: [] });
    vi.mocked(api.addPin).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useMessagePinning("conv1"));

    await waitFor(() => expect(api.pins).toHaveBeenCalled());

    await act(async () => {
      await result.current.togglePin("msg1");
    });

    expect(result.current.isPinned("msg1")).toBe(false);
  });

  test("togglePin reverts on API failure (remove)", async () => {
    vi.mocked(api.pins).mockResolvedValue({
      pins: [
        { id: "p1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
      ],
    });
    vi.mocked(api.removePin).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useMessagePinning("conv1"));

    await waitFor(() => expect(result.current.isPinned("msg1")).toBe(true));

    await act(async () => {
      await result.current.togglePin("msg1");
    });

    expect(result.current.isPinned("msg1")).toBe(true);
  });

  test("getPinnedMessages filters correctly", async () => {
    vi.mocked(api.pins).mockResolvedValue({
      pins: [
        { id: "p1", messageId: "msg1", conversationId: "conv1", createdAt: "2026-01-01" },
        { id: "p2", messageId: "msg3", conversationId: "conv1", createdAt: "2026-01-02" },
      ],
    });

    const { result } = renderHook(() => useMessagePinning("conv1"));

    await waitFor(() => expect(result.current.isPinned("msg1")).toBe(true));

    const filtered = result.current.getPinnedMessages(["msg1", "msg2", "msg3"]);
    expect(filtered).toEqual(["msg1", "msg3"]);
  });

  test("handles API load error gracefully", async () => {
    vi.mocked(api.pins).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMessagePinning("conv1"));

    await waitFor(() => expect(api.pins).toHaveBeenCalled());
    expect(result.current.isPinned("msg1")).toBe(false);
  });
});
