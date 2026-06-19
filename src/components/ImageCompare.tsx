import { useState } from "react";
import { X, ArrowLeftRight } from "lucide-react";
import { formatBytes } from "../app-state";
import type { AssetItem } from "../types";

export function ImageCompare({
  assets,
  onClose,
}: {
  assets: AssetItem[];
  onClose: () => void;
}) {
  const [highlight, setHighlight] = useState<string | null>(null);

  if (assets.length < 2) {
    onClose();
    return null;
  }

  return (
    <div className="image-compare-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="图片对比">
      <div className="image-compare" onClick={(e) => e.stopPropagation()}>
        <div className="image-compare-header">
          <h3><ArrowLeftRight size={16} /> 图片对比（{assets.length}）</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="image-compare-grid" data-count={assets.length}>
          {assets.map((asset) => {
            const isHighlighted = highlight === asset.id;
            return (
              <div
                key={asset.id}
                className={`image-compare-item${isHighlighted ? " highlighted" : ""}`}
                onMouseEnter={() => setHighlight(asset.id)}
                onMouseLeave={() => setHighlight(null)}
              >
                <img src={asset.url} alt={asset.filename} />
                <div className="image-compare-meta">
                  <strong>{asset.filename}</strong>
                  {asset.width && asset.height && (
                    <span>{asset.width}×{asset.height}</span>
                  )}
                  <span>{formatBytes(asset.size)}</span>
                  {asset.createdAt && (
                    <span>{new Date(asset.createdAt).toLocaleString("zh-CN")}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
