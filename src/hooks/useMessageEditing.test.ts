import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { useMessageEditing } from "./useMessageEditing";

vi.mock("../api", () => ({
  api: {
    edits: vi.fn(),
    addEdit: vi.fn(),
  },
}));

describe("useMessageEditing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads edits on mount", async () => {
    vi.mocked(api.edits).mockResolvedValue({
      edits: {
        msg1: [
          { id: "e1", messageId: "msg1", originalContent: "old", editedContent: "new", createdAt: "2026-01-01" },
        ],
      },
    });

    const { result } = renderHook(() => useMessageEditing("conv1"));

    await waitFor(() => expect(result.current.isEdited("msg1")).toBe(true));
    expect(result.current.getEditedContent("msg1")).toBe("new");
    expect(result.current.getEditCount("msg1")).toBe(1);
  });

  test("returns null for unedited messages", async () => {
    vi.mocked(api.edits).mockResolvedValue({ edits: {} });

    const { result } = renderHook(() => useMessageEditing("conv1"));

    await waitFor(() => expect(api.edits).toHaveBeenCalled());
    expect(result.current.getEditedContent("msg1")).toBe(null);
    expect(result.current.isEdited("msg1")).toBe(false);
    expect(result.current.getEditCount("msg1")).toBe(0);
  });

  test("returns empty edit history for unedited messages", async () => {
    vi.mocked(api.edits).mockResolvedValue({ edits: {} });

    const { result } = renderHook(() => useMessageEditing("conv1"));

    await waitFor(() => expect(api.edits).toHaveBeenCalled());
    expect(result.current.getEditHistory("msg1")).toEqual([]);
  });

  test("returns null when conversationId is null", () => {
    const { result } = renderHook(() => useMessageEditing(null));
    expect(result.current.getEditedContent("msg1")).toBe(null);
  });

  test("editMessage adds record optimistically", async () => {
    vi.mocked(api.edits).mockResolvedValue({ edits: {} });
    vi.mocked(api.addEdit).mockResolvedValue({
      edit: { id: "e1", messageId: "msg1", originalContent: "old", editedContent: "new", createdAt: "2026-01-01" },
    });

    const { result } = renderHook(() => useMessageEditing("conv1"));

    await waitFor(() => expect(api.edits).toHaveBeenCalled());

    await act(async () => {
      await result.current.editMessage("msg1", "old", "new");
    });

    expect(result.current.isEdited("msg1")).toBe(true);
    expect(result.current.getEditedContent("msg1")).toBe("new");
    expect(api.addEdit).toHaveBeenCalledWith("conv1", "msg1", "old", "new");
  });

  test("editMessage reverts on API failure", async () => {
    vi.mocked(api.edits).mockResolvedValue({ edits: {} });
    vi.mocked(api.addEdit).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useMessageEditing("conv1"));

    await waitFor(() => expect(api.edits).toHaveBeenCalled());

    await act(async () => {
      await result.current.editMessage("msg1", "old", "new");
    });

    expect(result.current.isEdited("msg1")).toBe(false);
    expect(result.current.getEditCount("msg1")).toBe(0);
  });

  test("getEditedContent returns last edit for multiple edits", async () => {
    vi.mocked(api.edits).mockResolvedValue({
      edits: {
        msg1: [
          { id: "e1", messageId: "msg1", originalContent: "v1", editedContent: "v2", createdAt: "2026-01-01" },
          { id: "e2", messageId: "msg1", originalContent: "v2", editedContent: "v3", createdAt: "2026-01-02" },
        ],
      },
    });

    const { result } = renderHook(() => useMessageEditing("conv1"));

    await waitFor(() => expect(result.current.getEditCount("msg1")).toBe(2));
    expect(result.current.getEditedContent("msg1")).toBe("v3");
  });

  test("handles API load error gracefully", async () => {
    vi.mocked(api.edits).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMessageEditing("conv1"));

    await waitFor(() => expect(api.edits).toHaveBeenCalled());
    expect(result.current.getEditedContent("msg1")).toBe(null);
  });
});
