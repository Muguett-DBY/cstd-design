import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { useServiceReadiness } from "./useServiceReadiness";

vi.mock("../api", () => ({
  api: {
    readiness: vi.fn(),
  },
}));

const snapshot = {
  status: "attention" as const,
  checkedAt: "2026-06-28T00:00:00.000Z",
  checks: [
    { id: "database" as const, label: "数据服务", status: "ready" as const, detail: "数据服务可访问。" },
    { id: "generation" as const, label: "生成服务", status: "attention" as const, detail: "生成服务尚未配置。" },
  ],
};

describe("useServiceReadiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads readiness only after authentication is enabled", async () => {
    vi.mocked(api.readiness).mockResolvedValue(snapshot);
    const { result, rerender } = renderHook(({ enabled }) => useServiceReadiness(enabled), {
      initialProps: { enabled: false },
    });

    expect(result.current.loading).toBe(false);
    expect(api.readiness).not.toHaveBeenCalled();

    rerender({ enabled: true });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.snapshot).toEqual(snapshot));
    expect(result.current.loading).toBe(false);
  });

  test("keeps stale readiness visible while manual refresh is in progress", async () => {
    vi.mocked(api.readiness)
      .mockResolvedValueOnce(snapshot)
      .mockResolvedValueOnce({ ...snapshot, status: "ready", checks: snapshot.checks.map((check) => ({ ...check, status: "ready" as const })) });

    const { result } = renderHook(() => useServiceReadiness(true));
    await waitFor(() => expect(result.current.snapshot).toEqual(snapshot));

    act(() => result.current.refresh());

    expect(result.current.loading).toBe(true);
    expect(result.current.snapshot).toEqual(snapshot);
    await waitFor(() => expect(result.current.snapshot?.status).toBe("ready"));
  });
});
