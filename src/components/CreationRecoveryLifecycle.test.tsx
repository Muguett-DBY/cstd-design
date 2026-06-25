import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, streamChat } from "../api";
import type { PersistedVideoTask } from "../hooks/useVideoTaskPersistence";
import { ChatWorkspace } from "./ChatWorkspace";
import { ImageWorkspace } from "./ImageWorkspace";
import { VideoWorkspace } from "./VideoWorkspace";

vi.mock("../api", () => ({
  api: {
    generateImage: vi.fn(),
    videoTask: vi.fn(),
    createVideo: vi.fn(),
  },
  streamChat: vi.fn(),
}));

const noopAsync = vi.fn().mockResolvedValue(undefined);
const storage = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => storage.clear(),
    length: 0,
    key: () => null,
  },
  configurable: true,
});

Object.defineProperty(Element.prototype, "scrollIntoView", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

describe("creation recovery lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    Object.defineProperty(window, "requestAnimationFrame", {
      value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      value: (id: number) => window.clearTimeout(id),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("resolves a restored chat backup only after the send completes", async () => {
    const onRecoveryResolved = vi.fn();
    vi.mocked(streamChat).mockImplementation(async (_payload, { onEvent }) => {
      onEvent({ type: "meta", conversationId: "conversation-1", userMessageId: "user-1", assistantMessageId: "assistant-1", truncated: false });
      onEvent({ type: "done", assistantMessageId: "assistant-1" });
    });

    render(
      <ChatWorkspace
        conversation={null}
        messages={[]}
        leaves={[]}
        loading={false}
        onCreate={noopAsync}
        onRename={noopAsync}
        onDelete={noopAsync}
        onBranch={noopAsync}
        onStreamEvent={vi.fn()}
        afterSend={noopAsync}
        onClearAll={noopAsync}
        onNotice={vi.fn()}
        initialRecoveryPayload={{ content: "恢复后的消息", parentId: null }}
        onRecoveryResolved={onRecoveryResolved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(onRecoveryResolved).toHaveBeenCalledOnce());
  });

  test("resolves a restored image backup after successful generation", async () => {
    const onRecoveryResolved = vi.fn();
    vi.mocked(api.generateImage).mockResolvedValue({
      asset: {
        id: "image-1",
        kind: "image",
        mediaType: "image/png",
        filename: "restored.png",
        size: 1,
        createdAt: "2026-06-26T00:00:00.000Z",
        url: "/restored.png",
      },
    });

    render(
      <ImageWorkspace
        assets={[]}
        onAssetsChanged={noopAsync}
        onNotice={vi.fn()}
        onClearAll={noopAsync}
        online
        initialRecoveryPayload={{ prompt: "恢复图片", style: "none", size: "1024x1024", referenceIds: [], count: 1 }}
        onRecoveryResolved={onRecoveryResolved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "生成图片" }));

    await waitFor(() => expect(onRecoveryResolved).toHaveBeenCalledOnce());
  });

  test("keeps a restored image backup when a batch retry is only partially successful", async () => {
    const onRecoveryResolved = vi.fn();
    vi.mocked(api.generateImage)
      .mockResolvedValueOnce({
        asset: {
          id: "image-1",
          kind: "image",
          mediaType: "image/png",
          filename: "one.png",
          size: 1,
          createdAt: "2026-06-26T00:00:00.000Z",
          url: "/one.png",
        },
      })
      .mockRejectedValueOnce(new Error("second failed"));

    render(
      <ImageWorkspace
        assets={[]}
        onAssetsChanged={noopAsync}
        onNotice={vi.fn()}
        onClearAll={noopAsync}
        online
        initialRecoveryPayload={{ prompt: "恢复批量图片", style: "none", size: "1024x1024", referenceIds: [], count: 2 }}
        onRecoveryResolved={onRecoveryResolved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "2 张" }));

    await waitFor(() => expect(api.generateImage).toHaveBeenCalledTimes(2));
    expect(onRecoveryResolved).not.toHaveBeenCalled();
  });

  test("resolves a restored video backup only when the task completes", async () => {
    vi.useFakeTimers();
    const onRecoveryResolved = vi.fn();
    const task: PersistedVideoTask = {
      id: "video-1",
      status: "queued",
      progress: 0,
      recipe: {
        prompt: "恢复视频",
        preset: "standard",
        fps: 24,
        width: 1152,
        height: 768,
        referenceAssetIds: [],
        keyframes: false,
      },
    };
    vi.mocked(api.videoTask).mockResolvedValue({
      task: { id: "video-1", status: "completed", progress: 100, assetUrl: "/video.mp4" },
    });

    render(
      <VideoWorkspace
        assets={[]}
        onAssetsChanged={noopAsync}
        onNotice={vi.fn()}
        onClearAll={noopAsync}
        videoTask={task}
        onVideoTaskChange={vi.fn()}
        submittedPrompt="恢复视频"
        onSubmittedPromptChange={vi.fn()}
        online
        initialRecoveryPayload={task.recipe}
        onRecoveryResolved={onRecoveryResolved}
      />,
    );

    expect(onRecoveryResolved).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);

    expect(onRecoveryResolved).toHaveBeenCalledOnce();
  });
});
