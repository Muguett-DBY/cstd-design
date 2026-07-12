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

  test("applies each asset view mode through a labelled toggle group", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AssetWorkspace
        assets={assets}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={vi.fn()}
        onRequestConfirm={vi.fn()}
      />,
    );

    const viewGroup = screen.getByRole("group", { name: "视图模式" });
    const assetGrid = container.querySelector(".asset-grid");
    const expectOnlyPressed = (name: "网格视图" | "列表视图" | "详情视图") => {
      const pressed = (["网格视图", "列表视图", "详情视图"] as const).filter(
        (buttonName) => screen.getByRole("button", { name: buttonName }).getAttribute("aria-pressed") === "true",
      );
      expect(pressed).toEqual([name]);
    };
    expect(viewGroup).toBeTruthy();
    expect(assetGrid).toBeTruthy();
    expectOnlyPressed("网格视图");
    expect(assetGrid?.classList.contains("view-list")).toBe(false);
    expect(assetGrid?.classList.contains("view-detail")).toBe(false);

    await user.click(screen.getByRole("button", { name: "列表视图" }));

    expectOnlyPressed("列表视图");
    expect(assetGrid?.classList.contains("view-list")).toBe(true);
    expect(assetGrid?.classList.contains("view-detail")).toBe(false);

    await user.click(screen.getByRole("button", { name: "详情视图" }));

    expectOnlyPressed("详情视图");
    expect(assetGrid?.classList.contains("view-list")).toBe(false);
    expect(assetGrid?.classList.contains("view-detail")).toBe(true);

    await user.click(screen.getByRole("button", { name: "网格视图" }));

    expectOnlyPressed("网格视图");
    expect(assetGrid?.classList.contains("view-list")).toBe(false);
    expect(assetGrid?.classList.contains("view-detail")).toBe(false);
  });

  test("opens image previews from the keyboard without nesting video controls", async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    const videoAsset: AssetItem = {
      id: "asset-video",
      kind: "video",
      mediaType: "video/mp4",
      filename: "clip.mp4",
      size: 4096,
      createdAt: "3",
      url: "/clip.mp4",
    };
    const { container } = render(
      <AssetWorkspace
        assets={[assets[0], videoAsset]}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={vi.fn()}
        onPreview={onPreview}
        onRequestConfirm={vi.fn()}
      />,
    );

    const video = container.querySelector("video");
    expect(screen.queryByRole("button", { name: "预览 clip.mp4" })).toBeNull();
    expect(video?.controls).toBe(true);
    expect(video?.closest("button")).toBeNull();

    const preview = screen.getByRole("button", { name: "预览 first.png" });
    preview.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onPreview).toHaveBeenCalledTimes(2);
    expect(onPreview).toHaveBeenNthCalledWith(1, assets[0]);
    expect(onPreview).toHaveBeenNthCalledWith(2, assets[0]);
  });

  test("selects an individually named asset checkbox from the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <AssetWorkspace
        assets={assets}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={vi.fn()}
        onRequestConfirm={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "选择素材 first.png" });
    checkbox.focus();
    await user.keyboard(" ");

    expect(screen.getByText("已选 1 项")).toBeTruthy();
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  test("preserves contiguous asset selection with Shift-click", async () => {
    const user = userEvent.setup();
    const rangeAssets: AssetItem[] = [
      { id: "asset-newest", kind: "upload", mediaType: "image/png", filename: "newest.png", size: 1024, createdAt: "2026-07-03T00:00:00.000Z", url: "/newest.png" },
      { id: "asset-middle", kind: "image", mediaType: "image/png", filename: "middle.png", size: 1536, createdAt: "2026-07-02T00:00:00.000Z", url: "/middle.png" },
      { id: "asset-oldest", kind: "image", mediaType: "image/png", filename: "oldest.png", size: 2048, createdAt: "2026-07-01T00:00:00.000Z", url: "/oldest.png" },
    ];
    render(
      <AssetWorkspace
        assets={rangeAssets}
        onAssetsChanged={vi.fn()}
        onClearAll={vi.fn()}
        onNotice={vi.fn()}
        onRequestConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "选择素材 newest.png" }));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByRole("checkbox", { name: "选择素材 oldest.png" }));
    await user.keyboard("{/Shift}");

    expect(screen.getByText("已选 3 项")).toBeTruthy();
    expect((screen.getByRole("checkbox", { name: "选择素材 newest.png" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: "选择素材 middle.png" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: "选择素材 oldest.png" }) as HTMLInputElement).checked).toBe(true);
  });

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
