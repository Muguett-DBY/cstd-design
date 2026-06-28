import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { ServiceReadinessPanel } from "./ServiceReadinessPanel";

vi.mock("../api", () => ({
  api: {
    readiness: vi.fn(),
  },
}));

const readySnapshot = {
  status: "ready" as const,
  checkedAt: "2026-06-28T00:00:00.000Z",
  checks: [
    { id: "database" as const, label: "数据服务", status: "ready" as const, detail: "数据服务可访问。" },
    { id: "media" as const, label: "素材存储", status: "ready" as const, detail: "素材存储已连接。" },
    { id: "generation" as const, label: "生成服务", status: "ready" as const, detail: "生成密钥已配置，实际可用性会在首次请求时确认。" },
    { id: "security" as const, label: "安全配置", status: "ready" as const, detail: "登录与签名配置完整。" },
  ],
};

describe("ServiceReadinessPanel", () => {
  beforeEach(() => {
    vi.mocked(api.readiness).mockResolvedValue(readySnapshot);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("loads safe readiness checks and lets the user refresh them", async () => {
    render(<ServiceReadinessPanel />);

    expect(screen.getByRole("status").textContent).toContain("正在检查");
    await screen.findByText("创作环境已就绪");
    expect(screen.getByText("生成服务").parentElement?.textContent).toContain("首次请求");

    fireEvent.click(screen.getByRole("button", { name: "重新检查服务状态" }));
    await waitFor(() => expect(api.readiness).toHaveBeenCalledTimes(2));
  });

  test("shows an actionable error state when readiness cannot be loaded", async () => {
    vi.mocked(api.readiness).mockRejectedValueOnce(new Error("网络连接失败"));

    render(<ServiceReadinessPanel />);

    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("网络连接失败");
    expect(screen.getByRole("button", { name: "重新检查服务状态" })).toBeTruthy();
  });
});
