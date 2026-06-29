import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../api";
import { ASSET_SORT_STORAGE_KEY } from "../storage-keys";
import type { AssetItem } from "../types";
import { AssetWorkspace } from "./AssetWorkspace";

vi.mock("../api", () => ({
  api: {
    deleteAsset: vi.fn(),
  },
}));

const assets: AssetItem[] = [
  { id: "asset-1", kind: "upload", mediaType: "image/png", filename: "first.png", size: 1024, createdAt: "1", url: "/first.png" },
  { id: "asset-2", kind: "image", mediaType: "image/png", filename: "second.png", size: 2048, createdAt: "2", url: "/second.png" },
];

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  },
});

describe("AssetWorkspace", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => cleanup());

  test("reports partial failures when deleting selected assets", async () => {
    const user = userEvent.setup();
    const onAssetsChanged = vi.fn().mockResolvedValue(undefined);
    const onNotice = vi.fn();
    const onRequestConfirm = vi.fn((_title: string, _message: string, _danger: boolean, onConfirm: () => void) => {
      void onConfirm();
    });
    vi.mocked(api.deleteAsset)
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("delete failed"));

    render(
      <AssetWorkspace
        assets={assets}
        onAssetsChanged={onAssetsChanged}
        onClearAll={vi.fn()}
        onNotice={onNotice}
        onRequestConfirm={onRequestConfirm}
      />,
    );

    await user.click(screen.getByLabelText("全选"));
    await user.click(screen.getByRole("button", { name: /删除选中/ }));

    await waitFor(() => {
      expect(onNotice).toHaveBeenCalledWith("已删除 1 个素材，1 个删除失败。");
    });
    expect(api.deleteAsset).toHaveBeenCalledWith("asset-1");
    expect(api.deleteAsset).toHaveBeenCalledWith("asset-2");
    expect(onAssetsChanged).toHaveBeenCalledOnce();
  });

  test("clears selected assets when changing tag filters", async () => {
    const user = userEvent.setup();
    storage.set("cstd-design:asset-tags", JSON.stringify({
      "asset-1": ["raw"],
      "asset-2": ["generated"],
    }));

    render(
      <AssetWorkspace
        assets={assets}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={vi.fn()}
        onRequestConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("全选"));
    expect(screen.getByText("已选 2 项")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "raw" }));

    expect(screen.queryByText(/已选/)).toBeNull();
    expect(screen.queryByRole("button", { name: /删除选中/ })).toBeNull();
  });

  test("restores the default asset sort and persists the reset", async () => {
    const user = userEvent.setup();
    storage.set(ASSET_SORT_STORAGE_KEY, "kindAsc");

    render(
      <AssetWorkspace
        assets={assets}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={vi.fn()}
        onRequestConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("排序：类型分组")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "恢复默认排序" }));

    expect(screen.getByText("排序：最新优先")).toBeTruthy();
    expect(storage.get(ASSET_SORT_STORAGE_KEY)).toBe("dateDesc");
    expect(screen.queryByRole("button", { name: "恢复默认排序" })).toBeNull();
  });

  test("applies an external tag filter target", async () => {
    storage.set("cstd-design:asset-tags", JSON.stringify({
      "asset-1": ["raw"],
      "asset-2": ["generated"],
    }));
    const onNotice = vi.fn();
    const onAssetFilterTargetHandled = vi.fn();

    render(
      <AssetWorkspace
        assets={assets}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={onNotice}
        onRequestConfirm={vi.fn()}
        assetFilterTarget={{ type: "tag", tag: "raw", requestId: 7 }}
        onAssetFilterTargetHandled={onAssetFilterTargetHandled}
      />,
    );

    await waitFor(() => {
      expect(onAssetFilterTargetHandled).toHaveBeenCalledWith(7);
    });
    expect(screen.getByText("first.png")).toBeTruthy();
    expect(screen.queryByText("second.png")).toBeNull();
    expect(onNotice).toHaveBeenCalledWith("已筛选标签：raw");
  });

  test("applies an external collection filter target", async () => {
    storage.set("cstd-design:asset-collections", JSON.stringify([
      {
        id: "collection-1",
        name: "Launch Board",
        assetIds: ["asset-2"],
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ]));
    const onNotice = vi.fn();
    const onAssetFilterTargetHandled = vi.fn();

    render(
      <AssetWorkspace
        assets={assets}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={onNotice}
        onRequestConfirm={vi.fn()}
        assetFilterTarget={{ type: "collection", collectionId: "collection-1", name: "Launch Board", requestId: 9 }}
        onAssetFilterTargetHandled={onAssetFilterTargetHandled}
      />,
    );

    await waitFor(() => {
      expect(onAssetFilterTargetHandled).toHaveBeenCalledWith(9);
    });
    expect(screen.queryByText("first.png")).toBeNull();
    expect(screen.getByText("second.png")).toBeTruthy();
    expect(onNotice).toHaveBeenCalledWith("已打开集合：Launch Board");
  });
});
