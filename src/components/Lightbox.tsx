import { AlertTriangle, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

export function Lightbox({ assets, startIndex, onClose }: { assets: AssetItem[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const prevButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const asset = assets[index];

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key === "ArrowLeft" && index > 0) { setIndex((i) => i - 1); return; }
      if (event.key === "ArrowRight" && index < assets.length - 1) { setIndex((i) => i + 1); return; }
      if (event.key === "Home") { setIndex(0); return; }
      if (event.key === "End") { setIndex(assets.length - 1); return; }
      if (event.key === "Tab") {
        const focusable = overlayRef.current?.querySelectorAll<HTMLElement>("button, a[href]");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, index, assets.length]);

  if (!asset) return null;

  const isFirst = index === 0;
  const isLast = assets.length === 1 || index === assets.length - 1;

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${asset.filename} - ${index + 1} of ${assets.length}`}
      onClick={onClose}
      ref={overlayRef}
      tabIndex={-1}
    >
      <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="关闭预览" ref={closeButtonRef}>
          <X size={24} />
        </button>
        <a href={`${asset.url}?download=1`} className="lightbox-download" aria-label="下载" download>
          <Download size={20} />
        </a>
        {!isFirst && (
          <button type="button" className="lightbox-nav lightbox-prev" onClick={() => setIndex((i) => i - 1)} aria-label="上一张" ref={prevButtonRef}>
            <ChevronLeft size={24} />
          </button>
        )}
        {!isLast && (
          <button type="button" className="lightbox-nav lightbox-next" onClick={() => setIndex((i) => i + 1)} aria-label="下一张">
            <ChevronRight size={24} />
          </button>
        )}
        {asset.mediaType.startsWith("video") ? (
          <video src={asset.url} controls className="lightbox-video" autoPlay />
        ) : (
          <LightboxImage key={asset.id} asset={asset} />
        )}
        <div className="lightbox-info">
          <strong>{asset.filename}</strong>
          <span>{asset.kind} · {formatBytes(asset.size)}</span>
          {assets.length > 1 && <span className="lightbox-counter" aria-live="polite">{index + 1} / {assets.length}</span>}
        </div>
      </div>
    </div>
  );
}
