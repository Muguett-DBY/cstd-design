import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { RecoveryCenter } from "./RecoveryCenter";
import type { CreationRecoveryRecord } from "../hooks/useCreationRecovery";
import type { AssetItem, ConversationSummary } from "../types";
import type { CreationActivity } from "../hooks/useCreationActivity";

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

const latestConversation: ConversationSummary = {
  id: "conversation-latest",
  title: "品牌发布计划",
  activeLeafId: null,
  createdAt: "2026-06-26T01:00:00.000Z",
  updatedAt: "2026-06-26T05:00:00.000Z",
};

const latestImage: AssetItem = {
  id: "image-latest",
  kind: "image",
  mediaType: "image/png",
  filename: "brand-key-visual.png",
  size: 1024,
  createdAt: "2026-06-26T04:30:00.000Z",
  url: "https://example.com/brand-key-visual.png",
};

const activities: CreationActivity[] = [
  { id: "activity-completed", type: "completed", workspace: "image", label: "图片恢复完成", createdAt: "2026-06-26T05:30:00.000Z" },
  { id: "activity-restored", type: "restored", workspace: "chat", label: "已打开未发送消息", createdAt: "2026-06-26T05:00:00.000Z" },
];

describe("RecoveryCenter", () => {
  afterEach(() => cleanup());

  test("shows count, records, select, dismiss, and clear actions", () => {
    const onSelect = vi.fn();
    const onDismiss = vi.fn();
    const onClear = vi.fn();

    render(<RecoveryCenter records={records} onSelect={onSelect} onDismiss={onDismiss} onClear={onClear} />);

    expect(screen.getByRole("button", { name: /创作中心，0 个进行中，2 个可恢复/ }).textContent).toContain("2");
    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    expect(screen.getByRole("dialog", { name: "创作中心" }).textContent).toContain("视频生成失败");
    fireEvent.click(screen.getByRole("button", { name: "忽略 未发送消息" }));
    expect(onDismiss).toHaveBeenCalledWith("chat-1");

    fireEvent.click(screen.getByRole("button", { name: "清空恢复记录" }));
    expect(onClear).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "打开 视频生成失败" }));
    expect(onSelect).toHaveBeenCalledWith(records[1]);
  });

  test("renders an accessible empty state", () => {
    render(<RecoveryCenter records={[]} onSelect={vi.fn()} onDismiss={vi.fn()} onClear={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /创作中心，0 个进行中，0 个可恢复/ }));
    expect(screen.getByRole("dialog", { name: "创作中心" }).textContent).toContain("暂无需要恢复的创作任务");
  });

  test("summarizes active and recent video work in the creation center", () => {
    const onOpenVideoTask = vi.fn();
    render(
      <RecoveryCenter
        records={[]}
        activeVideoTask={{ id: "task-active", status: "in_progress", progress: 42 }}
        recentVideoTasks={[
          { id: "task-done", prompt: "ocean reveal", status: "completed", finishedAt: "2026-06-26T04:30:00.000Z", assetUrl: "https://example.com/video.mp4" },
        ]}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
        onOpenVideoTask={onOpenVideoTask}
      />,
    );

    expect(screen.getByRole("button", { name: /创作中心，1 个进行中，0 个可恢复/ }).textContent).toContain("1");
    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    expect(screen.getByRole("dialog", { name: "创作中心" }).textContent).toContain("视频正在生成");
    expect(screen.getByRole("dialog", { name: "创作中心" }).textContent).toContain("42%");
    expect(screen.getByRole("dialog", { name: "创作中心" }).textContent).toContain("ocean reveal");

    fireEvent.click(screen.getByRole("button", { name: "查看当前视频任务" }));
    expect(onOpenVideoTask).toHaveBeenCalledOnce();
  });

  test("shows a quick status overview for the creation center", () => {
    render(
      <RecoveryCenter
        records={records}
        activeVideoTask={{ id: "task-active", status: "queued", progress: 0 }}
        recentVideoTasks={[
          { id: "task-done-1", prompt: "studio walk cycle", status: "completed", finishedAt: "2026-06-26T04:30:00.000Z" },
          { id: "task-done-2", prompt: "warm material preview", status: "completed", finishedAt: "2026-06-26T04:40:00.000Z" },
        ]}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心，1 个进行中，2 个可恢复/ }));

    const overview = screen.getByLabelText("创作中心状态概览");
    expect(overview.textContent).toContain("进行中");
    expect(overview.textContent).toContain("1");
    expect(overview.textContent).toContain("可恢复");
    expect(overview.textContent).toContain("2");
    expect(overview.textContent).toContain("最近完成");
    expect(overview.textContent).toContain("2");
  });

  test("continues recent work across chat, image, and video workspaces", () => {
    const onContinueConversation = vi.fn();
    const onOpenRecentImage = vi.fn();
    const onStartWorkspace = vi.fn();
    render(
      <RecoveryCenter
        records={[]}
        recentConversation={latestConversation}
        recentImage={latestImage}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
        onContinueConversation={onContinueConversation}
        onOpenRecentImage={onOpenRecentImage}
        onStartWorkspace={onStartWorkspace}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    expect(screen.getByRole("region", { name: "继续创作" }).textContent).toContain("品牌发布计划");
    expect(screen.getByRole("region", { name: "继续创作" }).textContent).toContain("brand-key-visual.png");

    fireEvent.click(screen.getByRole("button", { name: "继续最近对话" }));
    expect(onContinueConversation).toHaveBeenCalledWith("conversation-latest");

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
    fireEvent.click(screen.getByRole("button", { name: "查看最近图片" }));
    expect(onOpenRecentImage).toHaveBeenCalledWith(latestImage);

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
    fireEvent.click(screen.getByRole("button", { name: "开始视频创作" }));
    expect(onStartWorkspace).toHaveBeenCalledWith("video");
  });

  test("shows and clears recent creation activity", () => {
    const onClearActivity = vi.fn();
    render(
      <RecoveryCenter
        records={[]}
        activities={activities}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
        onClearActivity={onClearActivity}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    const activityRegion = screen.getByRole("region", { name: "近期创作活动" });
    expect(activityRegion.textContent).toContain("图片恢复完成");
    expect(activityRegion.textContent).toContain("已打开未发送消息");
    fireEvent.click(screen.getByRole("button", { name: "清空创作活动" }));
    expect(onClearActivity).toHaveBeenCalledOnce();
  });
});
