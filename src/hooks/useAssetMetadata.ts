import { useEffect, useState } from "react";
import { extractImageDimensions, extractVideoDuration } from "./asset-metadata";
import type { AssetItem } from "../types";

interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
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
    } else if (asset.mediaType.startsWith("video/")) {
      extractVideoDuration(asset.url).then((duration) => {
        if (!cancelled && duration !== null) setMetadata((m) => ({ ...m, duration }));
      });
    }
    return () => { cancelled = true; };
  }, [asset.id, asset.url, asset.mediaType, asset.width, asset.height]);

  return metadata;
}
