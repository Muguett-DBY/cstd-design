import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { formatServiceReadinessDiagnostics } from "../utils/serviceReadinessDiagnostics";
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
  const writeText = vi.fn();

  beforeEach(() => {
    vi.mocked(api.readiness).mockResolvedValue(readySnapshot);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("formats a copyable diagnostics summary without leaking secret-like values", () => {
    const tokenLikeValue = ["sk", "prod", "1234567890abcdef"].join("-");
    const assignedSecretValue = ["super", "secret", "value"].join("-");
    const text = formatServiceReadinessDiagnostics({
      status: "attention",
      checkedAt: "2026-06-28T01:02:03.000Z",
      checks: [
        readySnapshot.checks[0],
        {
          id: "generation",
          label: "生成服务",
          status: "attention",
          detail: `UPSTREAM_API_KEY=${tokenLikeValue} 未通过上游检查。`,
        },
        {
          id: "security",
          label: "安全配置",
          status: "attention",
          detail: `SESSION_SECRET=${assignedSecretValue} 缺失或格式错误。`,
        },
      ],
    });

    expect(text).toContain("cstd-design 服务诊断摘要");
    expect(text).toContain("整体状态: attention");
    expect(text).toContain("生成服务: attention");
    expect(text).not.toContain(tokenLikeValue);
    expect(text).not.toContain(assignedSecretValue);
    expect(text).not.toContain("UPSTREAM_API_KEY=");
    expect(text).not.toContain("SESSION_SECRET=");
  });

  test("loads safe readiness checks and lets the user refresh them", async () => {
    render(<ServiceReadinessPanel />);

    expect(screen.getByRole("status").textContent).toContain("正在检查");
    await screen.findByText("创作环境已就绪");
    expect(screen.getByText("生成服务").parentElement?.textContent).toContain("首次请求");

    fireEvent.click(screen.getByRole("button", { name: "重新检查服务状态" }));
    await waitFor(() => expect(api.readiness).toHaveBeenCalledTimes(2));
  });

  test("copies the sanitized diagnostics summary for support handoff", async () => {
    render(<ServiceReadinessPanel />);

    await screen.findByText("创作环境已就绪");
    fireEvent.click(screen.getByRole("button", { name: "复制诊断摘要" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain("cstd-design 服务诊断摘要");
    expect(writeText.mock.calls[0][0]).toContain("数据服务: ready");
    expect(screen.getByText("诊断摘要已复制。")).toBeTruthy();
  });

  test("shows an actionable error state when readiness cannot be loaded", async () => {
    vi.mocked(api.readiness).mockRejectedValueOnce(new Error("网络连接失败"));

    render(<ServiceReadinessPanel />);

    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("网络连接失败");
    expect(screen.getByRole("button", { name: "重新检查服务状态" })).toBeTruthy();
  });
});
