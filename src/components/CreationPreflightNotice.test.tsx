import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { ServiceReadinessSnapshot } from "../api";
import { CreationPreflightNotice } from "./CreationPreflightNotice";

const attentionSnapshot: ServiceReadinessSnapshot = {
  status: "attention",
  checkedAt: "2026-06-28T00:00:00.000Z",
  checks: [
    { id: "database", label: "数据服务", status: "ready", detail: "数据服务可访问。" },
    { id: "media", label: "素材存储", status: "attention", detail: "素材存储暂不可用，上传和生成结果可能无法保存。" },
    { id: "generation", label: "生成服务", status: "attention", detail: "生成服务尚未配置，咨询、图片和视频创作暂不可用。" },
    { id: "security", label: "安全配置", status: "ready", detail: "登录与签名配置完整。" },
  ],
};

describe("CreationPreflightNotice", () => {
  test("renders actionable guidance for degraded readiness checks without blocking creation", () => {
    const onRefresh = vi.fn();
    render(
      <CreationPreflightNotice
        workspace="image"
        snapshot={attentionSnapshot}
        loading={false}
        error=""
        onRefresh={onRefresh}
      />,
    );

    const notice = screen.getByRole("status", { name: "创作预检提醒" });
    expect(notice.textContent).toContain("创作前建议先处理 2 项服务配置");
    expect(notice.textContent).toContain("素材存储");
    expect(notice.textContent).toContain("生成服务");
    expect(notice.textContent).toContain("仍可继续尝试");

    fireEvent.click(screen.getByRole("button", { name: "重新检查创作预检" }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  test("stays hidden when all readiness checks are ready", () => {
    const readySnapshot: ServiceReadinessSnapshot = {
      ...attentionSnapshot,
      status: "ready",
      checks: attentionSnapshot.checks.map((check) => ({ ...check, status: "ready" as const })),
    };

    const { container } = render(
      <CreationPreflightNotice
        workspace="chat"
        snapshot={readySnapshot}
        loading={false}
        error=""
        onRefresh={vi.fn()}
      />,
    );

    expect(container.textContent).toBe("");
  });

  test("shows a retryable error if the preflight request cannot be loaded", () => {
    render(
      <CreationPreflightNotice
        workspace="video"
        snapshot={null}
        loading={false}
        error="网络连接失败"
        onRefresh={vi.fn()}
      />,
    );

    const alert = screen.getByRole("alert", { name: "创作预检失败" });
    expect(alert.textContent).toContain("网络连接失败");
    expect(alert.textContent).toContain("重新检查创作预检");
  });
});
