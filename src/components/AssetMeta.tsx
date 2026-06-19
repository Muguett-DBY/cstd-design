import { useAssetMetadata } from "../hooks/useAssetMetadata";
import { getAssetMetadata } from "../hooks/asset-metadata";
import type { AssetItem } from "../types";

export function AssetMeta({ asset }: { asset: AssetItem }) {
  const metadata = useAssetMetadata(asset);
  const details = getAssetMetadata({ ...asset, ...metadata });
  if (!details) return null;
  return <span className="asset-meta-details">{details}</span>;
}
