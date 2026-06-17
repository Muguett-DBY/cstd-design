import { AlertTriangle, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBytes } from "../app-state";
import type { AssetItem } from "../types";

function LightboxImage({ asset }: { asset: AssetItem }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="lightbox-fallback">
        <AlertTriangle size={48} />
        <span>图片加载失败</span>
      </div>
    );
  }
  return <img src={asset.url} alt={asset.filename} className="lightbox-image" onError={() => setError(true)} />;
}

export function Lightbox({ asset, onClose }: { asset: AssetItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={asset.filename} onClick={onClose}>
      <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="关闭预览">
          <X size={24} />
        </button>
        <a href={`${asset.url}?download=1`} className="lightbox-download" aria-label="下载" download>
          <Download size={20} />
        </a>
        {asset.mediaType.startsWith("video") ? (
          <video src={asset.url} controls className="lightbox-video" autoPlay />
        ) : (
          <LightboxImage key={asset.id} asset={asset} />
        )}
        <div className="lightbox-info">
          <strong>{asset.filename}</strong>
          <span>{asset.kind} · {formatBytes(asset.size)}</span>
        </div>
      </div>
    </div>
  );
}
