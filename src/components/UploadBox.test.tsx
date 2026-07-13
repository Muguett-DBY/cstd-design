import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AssetItem } from "../types";
import { UploadBox } from "./UploadBox";

const committedAsset: AssetItem = {
  id: "asset-1",
  kind: "upload",
  mediaType: "image/png",
  filename: "repeat.png",
  size: 6,
  createdAt: "2026-07-13T00:00:00.000Z",
  url: "/api/assets/asset-1",
};

class ControlledXMLHttpRequest {
  static instances: ControlledXMLHttpRequest[] = [];

  readonly upload = new EventTarget();
  private readonly events = new EventTarget();
  status = 0;
  response: unknown = null;
  responseType = "";
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn(() => this.events.dispatchEvent(new Event("abort")));

  constructor() {
    ControlledXMLHttpRequest.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    this.events.addEventListener(type, listener);
  }

  progress(loaded: number, total: number) {
    this.upload.dispatchEvent(new ProgressEvent("progress", {
      lengthComputable: true,
      loaded,
      total,
    }));
  }

  succeed(response: unknown = { assets: [committedAsset] }) {
    this.status = 200;
    this.response = response;
    this.events.dispatchEvent(new Event("load"));
  }
}

describe("UploadBox", () => {
  beforeEach(() => {
    ControlledXMLHttpRequest.instances = [];
    vi.stubGlobal("XMLHttpRequest", ControlledXMLHttpRequest);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("keeps the hidden file input outside the native upload trigger", () => {
    const { container } = render(<UploadBox onUploaded={vi.fn()} onNotice={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "上传参考图/视频" });
    const input = container.querySelector('input[type="file"]');

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(trigger.contains(input)).toBe(false);
  });

  test("resets the file input so the same file can be uploaded again", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn().mockResolvedValue(undefined);
    const onNotice = vi.fn();
    const { container } = render(<UploadBox onUploaded={onUploaded} onNotice={onNotice} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pixels"], "repeat.png", { type: "image/png" });

    await user.upload(input, file);
    expect(input.value).toBe("");
    expect(ControlledXMLHttpRequest.instances).toHaveLength(1);
    ControlledXMLHttpRequest.instances[0].succeed();

    await screen.findByRole("button", { name: "1 个文件已上传" });
    await waitFor(() => expect(onUploaded).toHaveBeenCalledOnce());
    expect(onUploaded).toHaveBeenNthCalledWith(1, [committedAsset]);
    expect(onNotice).toHaveBeenCalledWith("1 个文件上传成功。");

    await user.upload(input, file);
    expect(ControlledXMLHttpRequest.instances).toHaveLength(2);
    const secondAsset = { ...committedAsset, id: "asset-2", url: "/api/assets/asset-2" };
    ControlledXMLHttpRequest.instances[1].succeed({ assets: [secondAsset] });
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(2));
    expect(onUploaded).toHaveBeenNthCalledWith(2, [secondAsset]);
  });

  test("exposes progress and an independent working cancel action", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn().mockResolvedValue(undefined);
    const onNotice = vi.fn();
    const { container } = render(<UploadBox onUploaded={onUploaded} onNotice={onNotice} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(["pixels"], "cancel.png", { type: "image/png" }));
    const request = ControlledXMLHttpRequest.instances[0];
    request.progress(1, 2);

    const progress = await screen.findByRole("progressbar", { name: "上传进度" });
    expect(progress.getAttribute("aria-valuenow")).toBe("50");
    expect(progress.getAttribute("aria-valuetext")).toBe("50%");

    const cancel = screen.getByRole("button", { name: "取消上传" });
    expect(cancel.parentElement?.closest("button")).toBeNull();
    await user.click(cancel);

    await waitFor(() => expect(onNotice).toHaveBeenCalledWith("上传已取消。"));
    expect(request.abort).toHaveBeenCalledOnce();
    expect(onUploaded).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "上传参考图/视频" })).toBeTruthy();
  });

  test("removes the cancel action after the upload is committed while assets refresh", async () => {
    let finishRefresh: (() => void) | undefined;
    const refreshPending = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const user = userEvent.setup();
    const onUploaded = vi.fn(() => refreshPending);
    const { container } = render(<UploadBox onUploaded={onUploaded} onNotice={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(["pixels"], "accepted.png", { type: "image/png" }));
    ControlledXMLHttpRequest.instances[0].succeed();

    expect(await screen.findByText("上传完成，正在刷新素材...")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "取消上传" })).toBeNull();
    expect(screen.getByRole("progressbar", { name: "上传进度" }).getAttribute("aria-valuenow")).toBe("100");

    finishRefresh?.();
    await screen.findByRole("button", { name: "1 个文件已上传" });
  });

  test("keeps committed success truthful when the asset refresh callback rejects", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn().mockRejectedValue(new Error("refresh unavailable"));
    const onNotice = vi.fn();
    const { container } = render(<UploadBox onUploaded={onUploaded} onNotice={onNotice} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(["pixels"], "committed.png", { type: "image/png" }));
    ControlledXMLHttpRequest.instances[0].succeed({ assets: [committedAsset] });

    await screen.findByRole("button", { name: "1 个文件已上传" });
    expect(onUploaded).toHaveBeenCalledWith([committedAsset]);
    expect(onNotice).toHaveBeenCalledWith("1 个文件已上传，但素材列表刷新失败，请稍后重试。");
    expect(onNotice).not.toHaveBeenCalledWith("refresh unavailable");
  });

  test("keeps committed success truthful when the app reports a refresh failure", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn().mockResolvedValue(false);
    const onNotice = vi.fn();
    const { container } = render(<UploadBox onUploaded={onUploaded} onNotice={onNotice} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(["pixels"], "committed.png", { type: "image/png" }));
    ControlledXMLHttpRequest.instances[0].succeed({ assets: [committedAsset] });

    await screen.findByRole("button", { name: "1 个文件已上传" });
    expect(onUploaded).toHaveBeenCalledWith([committedAsset]);
    expect(onNotice).toHaveBeenCalledWith("1 个文件已上传，但素材列表刷新失败，请稍后重试。");
    expect(onNotice).not.toHaveBeenCalledWith("1 个文件上传成功。");
  });
});
