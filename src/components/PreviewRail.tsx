import { useState } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import type { AssetItem } from "../types";
import { EmptyState } from "./EmptyState";
import { formatBytes } from "../app-state";

export function PreviewRail({ assets, title, onPreview, initialLimit = 6 }: { assets: AssetItem[]; title: string; onPreview?: (asset: AssetItem) => void; initialLimit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? assets : assets.slice(0, initialLimit);
  const hiddenCount = assets.length - initialLimit;
  return (
    <aside className="preview-rail">
      <h3>{title} <span className="preview-rail-count">{assets.length}</span></h3>
      {assets.length === 0 ? (
        <EmptyState title="暂无作品" text="生成后会自动保存。" />
      ) : (
        <>
          <div className={`preview-rail-grid${expanded ? " expanded" : ""}`}>
            {visible.map((asset) => (
              <button type="button" className="preview-card" key={asset.id} title={asset.filename} onClick={() => {
                if (asset.mediaType.startsWith("video")) {
                  window.open(asset.url, "_blank", "noopener");
                } else {
                  onPreview?.(asset);
                }
              }}>
                {asset.mediaType.startsWith("video") ? <video src={asset.url} muted /> : <img src={asset.url} alt={asset.filename} loading="lazy" />}
                <span className="preview-card-name">{asset.filename}</span>
                {asset.width && asset.height && (
                  <span className="preview-card-meta">{asset.width}×{asset.height} · {formatBytes(asset.size)}</span>
                )}
              </button>
            ))}
          </div>
          {hiddenCount > 0 && (
            <button type="button" className="preview-rail-toggle" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <><ChevronUp size={14} /> 收起</> : <><ChevronDown size={14} /> 显示全部 {assets.length} 张</>}
            </button>
          )}
          {expanded && assets.length > 0 && (
            <div className="preview-rail-tip">
              <Eye size={12} /> 点击图片可在预览窗中查看
            </div>
          )}
        </>
      )}
    </aside>
  );
}
