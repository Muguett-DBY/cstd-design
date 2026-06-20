import { useEffect, useState } from "react";
import { extractImageDimensions, extractVideoDuration } from "./asset-metadata";
import type { AssetItem } from "../types";

interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  dominantColor?: string;
}

function extractDominantColor(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const pixel = ctx.getImageData(0, 0, 1, 1).data;
        const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
        resolve(hex);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function useAssetMetadata(asset: AssetItem): AssetMetadata {
  const [metadata, setMetadata] = useState<AssetMetadata>({
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
  });

  useEffect(() => {
    let cancelled = false;
    if (asset.width && asset.height) return;
    if (asset.mediaType.startsWith("image/")) {
      extractImageDimensions(asset.url).then((dims) => {
        if (!cancelled && dims) setMetadata((m) => ({ ...m, ...dims }));
      });
      extractDominantColor(asset.url).then((color) => {
        if (!cancelled && color) setMetadata((m) => ({ ...m, dominantColor: color }));
      });
    } else if (asset.mediaType.startsWith("video/")) {
      extractVideoDuration(asset.url).then((duration) => {
        if (!cancelled && duration !== null) setMetadata((m) => ({ ...m, duration }));
      });
    }
    return () => { cancelled = true; };
  }, [asset.id, asset.url, asset.mediaType, asset.width, asset.height]);

  return metadata;
}
