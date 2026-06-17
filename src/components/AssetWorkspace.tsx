import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "../api";
import { filterAssets, formatBytes } from "../app-state";
import type { AssetFilter, AssetItem } from "../types";
import { ClearAllButton } from "./ClearAllButton";
import { EmptyState } from "./EmptyState";
import { Segmented } from "./Segmented";

export function AssetWorkspace({ assets, onAssetsChanged, onClearAll, onNotice, onPreview, onRequestConfirm }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onClearAll: () => Promise<void>; onNotice: (message: string) => void; onPreview?: (asset: AssetItem) => void; onRequestConfirm: (title: string, message: string, danger: boolean, onConfirm: () => void) => void }) {
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const visible = filterAssets(assets, filter);
  return (
    <section className="asset-page">
      <div className="asset-toolbar">
        <h3>素材库</h3>
        <div className="toolbar-actions">
          <Segmented<AssetFilter>
            value={filter}
            options={[
              ["all", "全部"],
              ["upload", "上传"],
              ["image", "图片"],
              ["video", "视频"],
            ]}
            onChange={setFilter}
          />
          <ClearAllButton label="清空素材库" onClear={async () => {
            await onClearAll();
            await onAssetsChanged();
          }} />
        </div>
      </div>
      <div className="asset-grid">
        {visible.length === 0 ? (
          <EmptyState title="还没有素材" text="上传参考图或生成作品后，会出现在这里。" />
        ) : (
          visible.map((asset) => (
            <article className="asset-card" key={asset.id}>
              <div className="asset-preview" style={{ cursor: asset.mediaType.startsWith("video") ? "default" : "pointer" }} onClick={() => { if (!asset.mediaType.startsWith("video")) onPreview?.(asset); }}>
                {asset.mediaType.startsWith("video") ? <video src={asset.url} controls /> : <img src={asset.url} alt={asset.filename} loading="lazy" />}
              </div>
              <div className="asset-meta">
                <strong>{asset.filename}</strong>
                <span>{asset.kind} · {formatBytes(asset.size)}</span>
              </div>
              <div className="asset-actions">
                <a href={`${asset.url}?download=1`}>下载</a>
                <button type="button" className="danger" disabled={deletingId === asset.id} onClick={() => {
                  onRequestConfirm(
                    "删除素材",
                    `确认永久删除"${asset.filename}"？此操作不可恢复。`,
                    true,
                    async () => {
                      setDeletingId(asset.id);
                      try {
                        await api.deleteAsset(asset.id);
                        await onAssetsChanged();
                        onNotice("素材已删除。");
                      } catch (error) { onNotice(error instanceof Error ? error.message : "删除失败。"); }
                      finally { setDeletingId(null); }
                    },
                  );
                }}>
                  {deletingId === asset.id ? <><RefreshCw size={14} className="spin" /> 删除中</> : "删除"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
