import { useState } from "react";
import { Download, Eye, RefreshCw, Tag, Trash2 } from "lucide-react";
import { api } from "../api";
import { filterAssets, formatBytes } from "../app-state";
import type { AssetFilter, AssetItem } from "../types";
import { AssetMeta } from "./AssetMeta";
import { ClearAllButton } from "./ClearAllButton";
import { EmptyState } from "./EmptyState";
import { Segmented } from "./Segmented";
import { useAssetTags } from "../hooks/useAssetTags";
import { TagPicker } from "./TagPicker";

export function AssetWorkspace({ assets, onAssetsChanged, onClearAll, onNotice, onPreview, onRequestConfirm }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onClearAll: () => Promise<void>; onNotice: (message: string) => void; onPreview?: (asset: AssetItem) => void; onRequestConfirm: (title: string, message: string, danger: boolean, onConfirm: () => void) => void }) {
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClicked, setLastClicked] = useState<number | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { addTag, removeTag, getTags, allTags } = useAssetTags();
  const allAssets = assets;
  const byKind = filterAssets(allAssets, filter);
  const visible = tagFilter ? allAssets.filter((a) => byKind.some((b) => b.id === a.id) && getTags(a.id).includes(tagFilter)) : byKind;
  const totalSize = visible.reduce((sum, a) => sum + a.size, 0);
  const [showTagPickerFor, setShowTagPickerFor] = useState<string | null>(null);

  const toggleSelect = (id: string, index: number, shiftKey: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClicked !== null) {
        const [start, end] = lastClicked < index ? [lastClicked, index] : [index, lastClicked];
        for (let i = start; i <= end; i++) next.add(visible[i].id);
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLastClicked(index);
  };

  const selectAll = () => {
    if (selected.size === visible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((a) => a.id)));
    }
  };

  const deleteSelected = () => {
    const selectedIds = Array.from(selected);
    const count = selectedIds.length;
    onRequestConfirm("批量删除", `确认永久删除选中的 ${count} 个素材？此操作不可恢复。`, true, async () => {
      const results = await Promise.allSettled(selectedIds.map((id) => api.deleteAsset(id)));
      const failedCount = results.filter((result) => result.status === "rejected").length;
      setSelected(new Set());
      await onAssetsChanged();
      if (failedCount > 0) {
        onNotice(`已删除 ${count - failedCount} 个素材，${failedCount} 个删除失败。`);
      } else {
        onNotice(`已删除 ${count} 个素材。`);
      }
    });
  };

  const downloadSelected = () => {
    const selectedAssets = visible.filter((a) => selected.has(a.id));
    for (const asset of selectedAssets) {
      const a = document.createElement("a");
      a.href = `${asset.url}?download=1`;
      a.download = asset.filename;
      a.click();
    }
    onNotice(`已开始下载 ${selectedAssets.length} 个文件。`);
  };

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
            onChange={(v) => { setFilter(v); setSelected(new Set()); }}
          />
          {allTags().length > 0 && (
            <div className="tag-filter">
              <span className="tag-filter-label">标签：</span>
              <button
                type="button"
                className={`tag-chip clickable${tagFilter === null ? " active" : ""}`}
                onClick={() => setTagFilter(null)}
              >
                全部
              </button>
              {allTags().map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-chip clickable${tagFilter === tag ? " active" : ""}`}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <ClearAllButton label="清空素材库" onClear={async () => {
            await onClearAll();
            await onAssetsChanged();
          }} />
        </div>
      </div>
      <div className="asset-stats">
        {visible.length} 个文件，共 {formatBytes(totalSize)}
        {selected.size > 0 && (
          <span className="asset-batch-actions">
            <span className="asset-selected-count">已选 {selected.size} 项</span>
            <button type="button" className="ghost-button" onClick={downloadSelected}>
              <Download size={14} /> 下载选中
            </button>
            <button type="button" className="ghost-button danger" onClick={deleteSelected}>
              <Trash2 size={14} /> 删除选中
            </button>
          </span>
        )}
      </div>
      <div className="asset-grid">
        {visible.length === 0 ? (
          <EmptyState title={filter === "all" ? "还没有素材" : "没有匹配的素材"} text={filter === "all" ? "上传参考图或生成作品后，会出现在这里。" : `当前筛选条件下没有${filter === "upload" ? "上传" : filter === "image" ? "图片" : "视频"}素材。`} />
        ) : (
          <>
            <div className="asset-select-bar">
              <label className="asset-select-all">
                <input type="checkbox" checked={selected.size === visible.length && visible.length > 0} onChange={selectAll} />
                全选
              </label>
            </div>
            {visible.map((asset, index) => (
              <article className={`asset-card${selected.has(asset.id) ? " selected" : ""}`} key={asset.id}>
                <div className="asset-checkbox" onClick={(e) => { e.stopPropagation(); toggleSelect(asset.id, index, e.shiftKey); }}>
                  <input type="checkbox" checked={selected.has(asset.id)} readOnly />
                </div>
                <div className="asset-preview" style={{ cursor: asset.mediaType.startsWith("video") ? "default" : "pointer" }} onClick={() => { if (!asset.mediaType.startsWith("video")) onPreview?.(asset); }}>
                  {asset.mediaType.startsWith("video") ? <video src={asset.url} controls /> : <img src={asset.url} alt={asset.filename} loading="lazy" />}
                  {!asset.mediaType.startsWith("video") && (
                    <span className="asset-preview-hint" aria-hidden="true"><Eye size={14} /></span>
                  )}
                </div>
                <div className="asset-meta">
                  <strong>{asset.filename}</strong>
                  <span>{asset.kind} · {formatBytes(asset.size)}</span>
                  <AssetMeta asset={asset} />
                  {getTags(asset.id).length > 0 && (
                    <div className="asset-tag-chips">
                      {getTags(asset.id).map((tag) => (
                        <span key={tag} className="tag-chip small">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="asset-actions">
                  <button
                    type="button"
                    onClick={() => setShowTagPickerFor(showTagPickerFor === asset.id ? null : asset.id)}
                    className={showTagPickerFor === asset.id ? "active" : ""}
                    aria-label="编辑标签"
                    title="编辑标签"
                  >
                    <Tag size={14} /> 标签
                  </button>
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
                {showTagPickerFor === asset.id && (
                  <div className="asset-tag-picker-wrapper">
                    <TagPicker
                      assetId={asset.id}
                      onClose={() => setShowTagPickerFor(null)}
                      getTags={getTags}
                      allTags={allTags}
                      addTag={addTag}
                      removeTag={removeTag}
                    />
                  </div>
                )}
              </article>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
