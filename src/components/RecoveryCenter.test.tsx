import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
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

  test("recommends the highest priority creation action", () => {
    const onOpenVideoTask = vi.fn();
    render(
      <RecoveryCenter
        records={records}
        activeVideoTask={{ id: "task-active", status: "in_progress", progress: 64 }}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
        onOpenVideoTask={onOpenVideoTask}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    const recommendation = screen.getByRole("region", { name: "建议先处理" });
    expect(recommendation.textContent).toContain("视频正在生成");
    expect(recommendation.textContent).toContain("64%");

    fireEvent.click(screen.getByRole("button", { name: "查看建议任务" }));
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
    fireEvent.click(screen.getByRole("tab", { name: "近期活动 2" }));

    const activityRegion = screen.getByRole("region", { name: "近期创作活动" });
    expect(activityRegion.textContent).toContain("图片恢复完成");
    expect(activityRegion.textContent).toContain("已打开未发送消息");
    fireEvent.click(screen.getByRole("button", { name: "清空创作活动" }));
    expect(onClearActivity).toHaveBeenCalledOnce();
  });

  test("does not show an inactive clear-activity action without a clear handler", () => {
    render(
      <RecoveryCenter
        records={[]}
        activities={activities}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
    fireEvent.click(screen.getByRole("tab", { name: "近期活动 2" }));

    const activityRegion = screen.getByRole("region", { name: "近期创作活动" });
    expect(activityRegion.textContent).toContain("图片恢复完成");
    expect(screen.queryByRole("button", { name: "清空创作活动" })).toBeNull();
  });

  test("organizes continuation, tasks, and activity into accessible sections", () => {
    render(
      <RecoveryCenter
        records={records}
        activities={activities}
        recentConversation={latestConversation}
        recentImage={latestImage}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    expect(screen.getByRole("tablist", { name: "创作中心分区" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "待处理 2" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "待处理" }).textContent).toContain("视频生成失败");

    fireEvent.click(screen.getByRole("tab", { name: "继续创作" }));
    expect(screen.getByRole("tabpanel", { name: "继续创作" }).textContent).toContain("品牌发布计划");

    fireEvent.click(screen.getByRole("tab", { name: "近期活动 2" }));
    expect(screen.getByRole("tabpanel", { name: "近期活动" }).textContent).toContain("图片恢复完成");
  });

  test("filters pending creation work by workspace type", () => {
    render(
      <RecoveryCenter
        records={records}
        activeVideoTask={{ id: "task-active", status: "queued", progress: 0 }}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    expect(screen.getByRole("group", { name: "待处理类型筛选" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "只看咨询待处理" }));
    const chatPanel = screen.getByRole("tabpanel", { name: "待处理" });
    expect(chatPanel.textContent).toContain("未发送消息");
    expect(chatPanel.textContent).not.toContain("视频生成失败");
    expect(chatPanel.textContent).not.toContain("视频正在生成");

    fireEvent.click(screen.getByRole("button", { name: "只看视频待处理" }));
    const videoPanel = screen.getByRole("tabpanel", { name: "待处理" });
    expect(videoPanel.textContent).toContain("视频正在生成");
    expect(videoPanel.textContent).toContain("视频生成失败");
    expect(videoPanel.textContent).not.toContain("未发送消息");
  });

  test("announces the active pending-work filter", () => {
    render(
      <RecoveryCenter
        records={records}
        activeVideoTask={{ id: "task-active", status: "queued", progress: 0 }}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
    fireEvent.click(screen.getByRole("button", { name: "只看咨询待处理" }));

    const summary = screen.getByRole("status", { name: "待处理筛选摘要" });
    expect(summary.textContent).toContain("当前只看：咨询");
    expect(summary.textContent).toContain("1 项待处理");
  });

  test("clears only the currently filtered recovery records", () => {
    const onDismiss = vi.fn();
    const onClear = vi.fn();
    render(
      <RecoveryCenter
        records={records}
        onSelect={vi.fn()}
        onDismiss={onDismiss}
        onClear={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
    fireEvent.click(screen.getByRole("button", { name: "只看咨询待处理" }));
    fireEvent.click(screen.getByRole("button", { name: "清空咨询恢复记录" }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith("chat-1");
    expect(onClear).not.toHaveBeenCalled();
  });

  test("resets the pending-work filter from an empty filtered state", () => {
    render(
      <RecoveryCenter
        records={records}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
    fireEvent.click(screen.getByRole("button", { name: "只看图片待处理" }));

    expect(screen.getByRole("tabpanel", { name: "待处理" }).textContent).toContain("当前筛选没有待处理任务");

    fireEvent.click(screen.getByRole("button", { name: "显示全部待处理记录" }));
    const panel = screen.getByRole("tabpanel", { name: "待处理" });
    expect(panel.textContent).toContain("未发送消息");
    expect(panel.textContent).toContain("视频生成失败");
  });

  test("summarizes recovery risk and jumps to the highest-risk workspace", () => {
    render(
      <RecoveryCenter
        records={records}
        activeVideoTask={{ id: "task-active", status: "in_progress", progress: 68 }}
        onSelect={vi.fn()}
        onDismiss={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

    const riskSummary = screen.getByRole("region", { name: "恢复风险摘要" });
    expect(riskSummary.textContent).toContain("待处理总数");
    expect(riskSummary.textContent).toContain("3");
    expect(riskSummary.textContent).toContain("保存较久");
    expect(riskSummary.textContent).toContain("2");
    expect(riskSummary.textContent).toContain("集中工作区");
    expect(riskSummary.textContent).toContain("视频 2");

    fireEvent.click(screen.getByRole("button", { name: "只看视频恢复风险" }));

    const panel = screen.getByRole("tabpanel", { name: "待处理" });
    expect(panel.textContent).toContain("视频正在生成");
    expect(panel.textContent).toContain("视频生成失败");
    expect(panel.textContent).not.toContain("未发送消息");
  });

  test("opens a stale-only recovery queue from the risk summary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
    const mixedAgeRecords: CreationRecoveryRecord[] = [
      ...records,
      {
        id: "image-fresh",
        type: "image",
        workspace: "image",
        label: "刚刚保存的图片提示词",
        summary: "两小时前保存",
        createdAt: "2026-06-28T10:00:00.000Z",
        payload: { prompt: "fresh image", style: "none", size: "1024x1024", referenceIds: [], count: 1 },
      },
    ];

    try {
      render(
        <RecoveryCenter
          records={mixedAgeRecords}
          activeVideoTask={{ id: "task-active", status: "in_progress", progress: 68 }}
          onSelect={vi.fn()}
          onDismiss={vi.fn()}
          onClear={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
      fireEvent.click(screen.getByRole("button", { name: "从风险摘要查看保存较久的恢复项" }));

      const panel = screen.getByRole("tabpanel", { name: "待处理" });
      expect(panel.textContent).toContain("未发送消息");
      expect(panel.textContent).toContain("视频生成失败");
      expect(panel.textContent).not.toContain("刚刚保存的图片提示词");
      expect(panel.textContent).not.toContain("视频正在生成");
      expect(screen.getByRole("status", { name: "待处理筛选摘要" }).textContent).toContain("当前只看：保存较久");
    } finally {
      vi.useRealTimers();
    }
  });

  test("marks stale recovery records with visible and accessible priority cues", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
    const mixedAgeRecords: CreationRecoveryRecord[] = [
      ...records,
      {
        id: "image-fresh",
        type: "image",
        workspace: "image",
        label: "刚刚保存的图片提示词",
        summary: "两小时前保存",
        createdAt: "2026-06-28T10:00:00.000Z",
        payload: { prompt: "fresh image", style: "none", size: "1024x1024", referenceIds: [], count: 1 },
      },
    ];

    try {
      render(
        <RecoveryCenter
          records={mixedAgeRecords}
          onSelect={vi.fn()}
          onDismiss={vi.fn()}
          onClear={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

      const staleItem = screen.getByRole("listitem", { name: /保存较久的恢复项：未发送消息/ });
      expect(within(staleItem).getByText("保存较久")).toBeTruthy();
      expect(within(staleItem).getByText(/超过 24 小时未处理/)).toBeTruthy();

      const freshItem = screen.getByRole("listitem", { name: /恢复项：刚刚保存的图片提示词/ });
      expect(within(freshItem).queryByText("保存较久")).toBeNull();
      expect(within(freshItem).queryByText(/超过 24 小时未处理/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test("prioritizes the oldest stale recovery and opens it from the stale queue", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
    const newerStaleRecord: CreationRecoveryRecord = {
      id: "chat-stale-newer",
      type: "chat",
      workspace: "chat",
      label: "较新保存的咨询",
      summary: "昨天保存",
      createdAt: "2026-06-27T11:00:00.000Z",
      payload: { content: "newer stale", parentId: null },
    };
    const oldestStaleRecord: CreationRecoveryRecord = {
      id: "video-stale-oldest",
      type: "video",
      workspace: "video",
      label: "最旧保存的视频",
      summary: "三天前保存",
      createdAt: "2026-06-25T01:00:00.000Z",
      payload: { prompt: "oldest video", preset: "standard", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
    };
    const freshRecord: CreationRecoveryRecord = {
      id: "chat-fresh",
      type: "chat",
      workspace: "chat",
      label: "刚保存的咨询",
      summary: "两小时前保存",
      createdAt: "2026-06-28T10:00:00.000Z",
      payload: { content: "fresh", parentId: null },
    };
    const onSelect = vi.fn();
    const onDismiss = vi.fn();

    try {
      render(
        <RecoveryCenter
          records={[newerStaleRecord, freshRecord, oldestStaleRecord]}
          onSelect={onSelect}
          onDismiss={onDismiss}
          onClear={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
      fireEvent.click(screen.getByRole("button", { name: "从风险摘要查看保存较久的恢复项" }));

      const panel = screen.getByRole("tabpanel", { name: "待处理" });
      const staleItems = within(panel).getAllByRole("listitem");
      expect(staleItems[0].getAttribute("aria-label")).toContain("最旧保存的视频");
      expect(staleItems[1].getAttribute("aria-label")).toContain("较新保存的咨询");
      expect(panel.textContent).not.toContain("刚保存的咨询");

      const priorityRegion = screen.getByRole("region", { name: "保存较久优先处理" });
      expect(priorityRegion.textContent).toContain("最旧保存的视频");
      expect(priorityRegion.textContent).toContain("共 2 项，按最旧优先处理");
      fireEvent.click(within(priorityRegion).getByRole("button", { name: "忽略最旧保存的恢复项" }));
      expect(onDismiss).toHaveBeenCalledWith(oldestStaleRecord.id);
      expect(onSelect).not.toHaveBeenCalled();

      fireEvent.click(within(priorityRegion).getByRole("button", { name: "打开最旧保存的恢复项" }));
      expect(onSelect).toHaveBeenCalledWith(oldestStaleRecord);
    } finally {
      vi.useRealTimers();
    }
  });

  test("clears all stale recoveries directly from the priority panel", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
    const newerStaleRecord: CreationRecoveryRecord = {
      id: "chat-stale-newer",
      type: "chat",
      workspace: "chat",
      label: "较新保存的咨询",
      summary: "昨天保存",
      createdAt: "2026-06-27T11:00:00.000Z",
      payload: { content: "newer stale", parentId: null },
    };
    const oldestStaleRecord: CreationRecoveryRecord = {
      id: "video-stale-oldest",
      type: "video",
      workspace: "video",
      label: "最旧保存的视频",
      summary: "三天前保存",
      createdAt: "2026-06-25T01:00:00.000Z",
      payload: { prompt: "oldest video", preset: "standard", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
    };
    const freshRecord: CreationRecoveryRecord = {
      id: "image-fresh",
      type: "image",
      workspace: "image",
      label: "刚保存的图片",
      summary: "两小时前保存",
      createdAt: "2026-06-28T10:00:00.000Z",
      payload: { prompt: "fresh", style: "none", size: "1024x1024", referenceIds: [], count: 1 },
    };
    const onDismiss = vi.fn();
    const onClear = vi.fn();

    try {
      render(
        <RecoveryCenter
          records={[freshRecord, newerStaleRecord, oldestStaleRecord]}
          onSelect={vi.fn()}
          onDismiss={onDismiss}
          onClear={onClear}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
      fireEvent.click(screen.getByRole("button", { name: "从风险摘要查看保存较久的恢复项" }));

      const priorityRegion = screen.getByRole("region", { name: "保存较久优先处理" });
      fireEvent.click(within(priorityRegion).getByRole("button", { name: "忽略全部保存较久恢复项" }));

      expect(onDismiss).toHaveBeenCalledTimes(2);
      expect(onDismiss).toHaveBeenNthCalledWith(1, oldestStaleRecord.id);
      expect(onDismiss).toHaveBeenNthCalledWith(2, newerStaleRecord.id);
      expect(onDismiss).not.toHaveBeenCalledWith(freshRecord.id);
      expect(onClear).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  test("returns to the remaining queue with a completion notice after bulk stale cleanup", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
    const newerStaleRecord: CreationRecoveryRecord = {
      id: "chat-stale-newer",
      type: "chat",
      workspace: "chat",
      label: "较新保存的咨询",
      summary: "昨天保存",
      createdAt: "2026-06-27T11:00:00.000Z",
      payload: { content: "newer stale", parentId: null },
    };
    const oldestStaleRecord: CreationRecoveryRecord = {
      id: "video-stale-oldest",
      type: "video",
      workspace: "video",
      label: "最旧保存的视频",
      summary: "三天前保存",
      createdAt: "2026-06-25T01:00:00.000Z",
      payload: { prompt: "oldest video", preset: "standard", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
    };
    const freshRecord: CreationRecoveryRecord = {
      id: "image-fresh",
      type: "image",
      workspace: "image",
      label: "刚保存的图片",
      summary: "两小时前保存",
      createdAt: "2026-06-28T10:00:00.000Z",
      payload: { prompt: "fresh", style: "none", size: "1024x1024", referenceIds: [], count: 1 },
    };

    function StatefulRecoveryCenter() {
      const [currentRecords, setCurrentRecords] = useState([freshRecord, newerStaleRecord, oldestStaleRecord]);
      return (
        <RecoveryCenter
          records={currentRecords}
          onSelect={vi.fn()}
          onDismiss={(id) => setCurrentRecords((items) => items.filter((item) => item.id !== id))}
          onClear={() => setCurrentRecords([])}
        />
      );
    }

    try {
      render(<StatefulRecoveryCenter />);

      fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
      fireEvent.click(screen.getByRole("button", { name: "从风险摘要查看保存较久的恢复项" }));
      fireEvent.click(screen.getByRole("button", { name: "忽略全部保存较久恢复项" }));

      expect(screen.getByRole("status", { name: "恢复清理结果" }).textContent).toContain("已忽略 2 项保存较久记录");
      expect(screen.getByRole("status", { name: "待处理筛选摘要" }).textContent).toContain("当前显示：全部");
      const panel = screen.getByRole("tabpanel", { name: "待处理" });
      expect(panel.textContent).toContain("刚保存的图片");
      expect(panel.textContent).not.toContain("较新保存的咨询");
      expect(panel.textContent).not.toContain("最旧保存的视频");
    } finally {
      vi.useRealTimers();
    }
  });

  test("shows a scannable pending-work flow guide", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
    const mixedAgeRecords: CreationRecoveryRecord[] = [
      ...records,
      {
        id: "image-fresh",
        type: "image",
        workspace: "image",
        label: "刚刚保存的图片提示词",
        summary: "两小时前保存",
        createdAt: "2026-06-28T10:00:00.000Z",
        payload: { prompt: "fresh image", style: "none", size: "1024x1024", referenceIds: [], count: 1 },
      },
    ];

    try {
      render(
        <RecoveryCenter
          records={mixedAgeRecords}
          onSelect={vi.fn()}
          onDismiss={vi.fn()}
          onClear={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));

      const flowGuide = screen.getByRole("region", { name: "待处理流程提示" });
      expect(flowGuide.textContent).toContain("先看优先级");
      expect(flowGuide.textContent).toContain("2 项保存较久");
      expect(flowGuide.textContent).toContain("当前队列");
      expect(flowGuide.textContent).toContain("全部");
      expect(flowGuide.textContent).toContain("下一步");
      expect(flowGuide.textContent).toContain("恢复或忽略");

      fireEvent.click(screen.getByRole("button", { name: "从风险摘要查看保存较久的恢复项" }));
      expect(screen.getByRole("region", { name: "待处理流程提示" }).textContent).toContain("保存较久");
    } finally {
      vi.useRealTimers();
    }
  });

  test("prioritizes stale records inside a workspace-specific recovery queue", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
    const videoQueueRecords: CreationRecoveryRecord[] = [
      {
        id: "video-fresh",
        type: "video",
        workspace: "video",
        label: "刚保存的视频提示词",
        summary: "刚保存的草稿",
        createdAt: "2026-06-28T10:00:00.000Z",
        payload: { prompt: "fresh video", preset: "standard", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
      },
      {
        id: "video-stale",
        type: "video",
        workspace: "video",
        label: "较久保存的视频提示词",
        summary: "两天前保存的草稿",
        createdAt: "2026-06-26T08:00:00.000Z",
        payload: { prompt: "stale video", preset: "standard", fps: 24, width: 1152, height: 768, referenceAssetIds: [], keyframes: false },
      },
    ];

    try {
      render(
        <RecoveryCenter
          records={videoQueueRecords}
          onSelect={vi.fn()}
          onDismiss={vi.fn()}
          onClear={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /创作中心/ }));
      fireEvent.click(screen.getByRole("button", { name: "只看视频待处理" }));

      const queuePrompt = screen.getByRole("region", { name: "当前队列优先提示" });
      expect(queuePrompt.textContent).toContain("视频队列含 1 项保存较久");
      expect(queuePrompt.textContent).toContain("已排在当前队列前面");

      const videoItems = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(videoItems[0].getAttribute("aria-label")).toContain("较久保存的视频提示词");
      expect(videoItems[1].getAttribute("aria-label")).toContain("刚保存的视频提示词");

      fireEvent.click(within(queuePrompt).getByRole("button", { name: "查看全部保存较久恢复项" }));
      expect(screen.getByRole("status", { name: "待处理筛选摘要" }).textContent).toContain("当前只看：保存较久");
    } finally {
      vi.useRealTimers();
    }
  });
});
