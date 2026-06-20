import { useAssetMetadata } from "../hooks/useAssetMetadata";
import { getAssetMetadata } from "../hooks/asset-metadata";
import type { AssetItem } from "../types";

export function AssetMeta({ asset }: { asset: AssetItem }) {
  const metadata = useAssetMetadata(asset);
  const details = getAssetMetadata({ ...asset, ...metadata });
  return (
    <span className="asset-meta-details">
      {details}
      {metadata.dominantColor && (
        <span className="asset-dominant-color" title={`主色调: ${metadata.dominantColor}`}>
          <span className="color-swatch" style={{ background: metadata.dominantColor }} />
        </span>
      )}
    </span>
  );
}
