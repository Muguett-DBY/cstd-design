import type { AssetItem } from "../types";
import { EmptyState } from "./EmptyState";

export function PreviewRail({ assets, title, onPreview }: { assets: AssetItem[]; title: string; onPreview?: (asset: AssetItem) => void }) {
  return (
    <aside className="preview-rail">
      <h3>{title}</h3>
      {assets.length === 0 ? <EmptyState title="暂无作品" text="生成后会自动保存。" /> : assets.slice(0, 6).map((asset) => (
        <button type="button" className="preview-card" key={asset.id} onClick={() => {
          if (asset.mediaType.startsWith("video")) {
            window.open(asset.url, "_blank", "noopener");
          } else {
            onPreview?.(asset);
          }
        }}>
          {asset.mediaType.startsWith("video") ? <video src={asset.url} muted /> : <img src={asset.url} alt={asset.filename} loading="lazy" />}
          <span>{asset.filename}</span>
        </button>
      ))}
    </aside>
  );
}
