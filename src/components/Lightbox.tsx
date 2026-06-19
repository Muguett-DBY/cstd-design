import { AlertTriangle, ChevronLeft, ChevronRight, Download, Edit, Info, Maximize2, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatBytes } from "../app-state";
import type { AssetItem } from "../types";
import { formatDimensions, formatDuration } from "../hooks/asset-metadata";
import { useAssetMetadata } from "../hooks/useAssetMetadata";

function LightboxImage({ asset, zoom }: { asset: AssetItem; zoom: number }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="lightbox-fallback">
        <AlertTriangle size={48} />
        <span>图片加载失败</span>
      </div>
    );
  }
  return (
    <img
      src={asset.url}
      alt={asset.filename}
      className="lightbox-image"
      onError={() => setError(true)}
      style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? "zoom-out" : "zoom-in", transition: "transform 0.2s ease" }}
    />
  );
}

export function Lightbox({ assets, startIndex, onClose, onEdit }: { assets: AssetItem[]; startIndex: number; onClose: () => void; onEdit?: (asset: AssetItem) => void }) {
  const [index, setIndex] = useState(startIndex);
  const [showInfo, setShowInfo] = useState(false);
  const [zoomByIndex, setZoomByIndex] = useState<Record<number, number>>({ [startIndex]: 1 });
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const prevButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const asset = assets[index];
  const metadata = useAssetMetadata(asset);
  const zoom = zoomByIndex[index] ?? 1;
  const setZoom = useCallback((updater: number | ((prev: number) => number)) => {
    setZoomByIndex((prevMap) => {
      const current = prevMap[index] ?? 1;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prevMap, [index]: next };
    });
  }, [index]);

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
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((z) => Math.min(z + 0.25, 4));
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        setZoom((z) => Math.max(z - 0.25, 0.5));
        return;
      }
      if (event.key === "0") { setZoom(1); return; }
      if (event.key === "i" || event.key === "I") { setShowInfo((s) => !s); return; }
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
  }, [onClose, index, assets.length, setZoom]);

  if (!asset) return null;

  const isFirst = index === 0;
  const isLast = assets.length === 1 || index === assets.length - 1;
  const isImage = !asset.mediaType.startsWith("video");

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void contentRef.current?.requestFullscreen();
    }
  };

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
      <div className="lightbox-content" onClick={(event) => event.stopPropagation()} ref={contentRef}>
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="关闭预览" ref={closeButtonRef}>
          <X size={24} />
        </button>
        <a href={`${asset.url}?download=1`} className="lightbox-download" aria-label="下载" download>
          <Download size={20} />
        </a>
        <button
          type="button"
          className="lightbox-info-toggle"
          onClick={() => setShowInfo((s) => !s)}
          aria-label="显示信息"
          aria-pressed={showInfo}
        >
          <Info size={20} />
        </button>
        {isImage && onEdit && (
          <button
            type="button"
            className="lightbox-edit"
            onClick={() => onEdit(asset)}
            aria-label="编辑图片"
            title="编辑"
          >
            <Edit size={20} />
          </button>
        )}
        <button
          type="button"
          className="lightbox-fullscreen"
          onClick={toggleFullscreen}
          aria-label="切换全屏"
        >
          <Maximize2 size={20} />
        </button>
        {isImage && (
          <>
            <button
              type="button"
              className="lightbox-zoom lightbox-zoom-out"
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              aria-label="缩小"
              disabled={zoom <= 0.5}
            >
              <Minus size={18} />
            </button>
            <button
              type="button"
              className="lightbox-zoom lightbox-zoom-in"
              onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
              aria-label="放大"
              disabled={zoom >= 4}
            >
              <Plus size={18} />
            </button>
          </>
        )}
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
          <LightboxImage key={asset.id} asset={asset} zoom={zoom} />
        )}
        {showInfo && (
          <div className="lightbox-info-panel" role="region" aria-label="资产元数据">
            <h4>详细信息</h4>
            <dl>
              <dt>文件名</dt><dd>{asset.filename}</dd>
              <dt>类型</dt><dd>{asset.kind}</dd>
              <dt>大小</dt><dd>{formatBytes(asset.size)}</dd>
              {(metadata.width && metadata.height) && (<><dt>尺寸</dt><dd>{formatDimensions(metadata.width, metadata.height)}</dd></>)}
              {metadata.duration && (<><dt>时长</dt><dd>{formatDuration(metadata.duration)}</dd></>)}
              <dt>MIME</dt><dd>{asset.mediaType}</dd>
            </dl>
          </div>
        )}
        <div className="lightbox-info">
          <strong>{asset.filename}</strong>
          <span>{asset.kind} · {formatBytes(asset.size)}</span>
          {isImage && zoom !== 1 && <span className="lightbox-zoom-level">{Math.round(zoom * 100)}%</span>}
          {assets.length > 1 && <span className="lightbox-counter" aria-live="polite">{index + 1} / {assets.length}</span>}
        </div>
      </div>
    </div>
  );
}
