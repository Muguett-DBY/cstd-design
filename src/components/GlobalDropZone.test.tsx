import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import type { AssetItem } from "../types";
import { GlobalDropZone } from "./GlobalDropZone";

vi.mock("../api", () => ({
  api: { upload: vi.fn() },
}));

vi.mock("../utils/imageCompression", () => ({
  shouldCompress: vi.fn(() => false),
  compressImage: vi.fn(),
}));

const committedAsset: AssetItem = {
  id: "global-drop-1",
  kind: "upload",
  mediaType: "image/png",
  filename: "global-drop.png",
  size: 6,
  createdAt: "2026-07-13T00:00:00.000Z",
  url: "/api/assets/global-drop-1",
};

function dispatchFileDrop(file: File) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: { files: [file], types: ["Files"] },
  });
  window.dispatchEvent(event);
}

describe("GlobalDropZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.upload).mockResolvedValue({ assets: [committedAsset] });
  });

  afterEach(() => {
    cleanup();
  });

  test("reports a committed upload when the app reports a refresh failure", async () => {
    const onUploaded = vi.fn().mockResolvedValue(false);
    const onNotice = vi.fn();
    render(<GlobalDropZone onUploaded={onUploaded} onNotice={onNotice} />);

    dispatchFileDrop(new File(["pixels"], "global-drop.png", { type: "image/png" }));

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith([committedAsset]));
    expect(onNotice).toHaveBeenCalledWith("1 个文件已上传，但素材列表刷新失败，请稍后重试。");
    expect(onNotice).not.toHaveBeenCalledWith("已上传 1 个文件。");
  });
});
