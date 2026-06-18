import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ThreadReply } from "../types";
import { api } from "../api";
import { useMessageThreading } from "./useMessageThreading";

vi.mock("../api", () => ({
  api: {
    threadReplies: vi.fn(),
    createThreadReply: vi.fn(),
    updateThreadReply: vi.fn(),
    deleteThreadReply: vi.fn(),
    clearMessageThread: vi.fn(),
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

const reply = (conversationId: string, id: string): ThreadReply => ({
  id,
  conversationId,
  parentMessageId: "00000000-0000-4000-8000-000000000001",
  content: id,
  createdAt: "2026-06-18T00:00:00.000Z",
  updatedAt: "2026-06-18T00:00:00.000Z",
});

describe("useMessageThreading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("keeps the newest conversation response when an older request resolves late", async () => {
    const first = deferred<{ replies: ThreadReply[] }>();
    const second = deferred<{ replies: ThreadReply[] }>();
    vi.mocked(api.threadReplies)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ conversationId }) => useMessageThreading(conversationId),
      { initialProps: { conversationId: "00000000-0000-4000-8000-000000000010" } },
    );

    rerender({ conversationId: "00000000-0000-4000-8000-000000000020" });
    await act(async () => second.resolve({ replies: [reply("00000000-0000-4000-8000-000000000020", "new")] }));
    await waitFor(() => expect(result.current.replies[0]?.id).toBe("new"));

    await act(async () => first.resolve({ replies: [reply("00000000-0000-4000-8000-000000000010", "old")] }));
    expect(result.current.replies[0]?.id).toBe("new");
    expect(result.current.loading).toBe(false);
  });
});
