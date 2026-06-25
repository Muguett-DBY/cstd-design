import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { RecoveryCenter } from "./RecoveryCenter";
import type { CreationRecoveryRecord } from "../hooks/useCreationRecovery";

const records: CreationRecoveryRecord[] = [
  {
    id: "chat-1",
    type: "chat",
    workspace: "chat",
    label: "未发送消息",
    summary: "网络中断",
    createdAt: "2026-06-26T03:00:00.000Z",
    payload: { content: "hello", parentId: null },
  },
  {
    id: "video-1",
    type: "video",
    workspace: "video",
    label: "视频生成失败",
    summary: "standard · 24fps",
    createdAt: "2026-06-26T04:00:00.000Z",
    payload: { prompt: "rain", preset: "standard", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
  },
];

describe("RecoveryCenter", () => {
  test("shows count, records, select, dismiss, and clear actions", () => {
    const onSelect = vi.fn();
    const onDismiss = vi.fn();
    const onClear = vi.fn();

    render(<RecoveryCenter records={records} onSelect={onSelect} onDismiss={onDismiss} onClear={onClear} />);

    expect(screen.getByRole("button", { name: /恢复中心，2 个待处理项/ }).textContent).toContain("2");
    fireEvent.click(screen.getByRole("button", { name: /恢复中心/ }));

    expect(screen.getByRole("dialog", { name: "恢复中心" }).textContent).toContain("视频生成失败");
    fireEvent.click(screen.getByRole("button", { name: "忽略 未发送消息" }));
    expect(onDismiss).toHaveBeenCalledWith("chat-1");

    fireEvent.click(screen.getByRole("button", { name: "清空恢复记录" }));
    expect(onClear).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "打开 视频生成失败" }));
    expect(onSelect).toHaveBeenCalledWith(records[1]);
  });

  test("renders an accessible empty state", () => {
    render(<RecoveryCenter records={[]} onSelect={vi.fn()} onDismiss={vi.fn()} onClear={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /恢复中心，0 个待处理项/ }));
    expect(screen.getByRole("dialog", { name: "恢复中心" }).textContent).toContain("暂无需要恢复的创作任务");
  });
});
