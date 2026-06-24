import { useAssetMetadata } from "../hooks/useAssetMetadata";
import { analyzeAssetQuality } from "../hooks/useAssetQuality";
import { formatBytes } from "../app-state";
import type { AssetItem } from "../types";

interface AssetMetadataPanelProps {
  asset: AssetItem;
}

export function AssetMetadataPanel({ asset }: AssetMetadataPanelProps) {
  const metadata = useAssetMetadata(asset);
  const quality = analyzeAssetQuality(asset);

  return (
    <div className="asset-metadata-panel" role="region" aria-label="资产详细信息">
      <div className="metadata-section">
        <h4>基本信息</h4>
        <dl className="metadata-grid">
          <dt>文件名</dt>
          <dd>{asset.filename}</dd>
          <dt>类型</dt>
          <dd>{asset.kind}</dd>
          <dt>大小</dt>
          <dd>{formatBytes(asset.size)}</dd>
          <dt>MIME</dt>
          <dd>{asset.mediaType}</dd>
          {metadata.width && metadata.height && (
            <>
              <dt>尺寸</dt>
              <dd>{metadata.width} × {metadata.height}</dd>
            </>
          )}
          {metadata.duration && (
            <>
              <dt>时长</dt>
              <dd>{metadata.duration.toFixed(1)}s</dd>
            </>
          )}
          <dt>创建时间</dt>
          <dd>{new Date(asset.createdAt).toLocaleString("zh-CN")}</dd>
        </dl>
      </div>

      {metadata.dominantColor && (
        <div className="metadata-section">
          <h4>主色调</h4>
          <div className="color-palette">
            <div className="color-swatch-large" style={{ background: metadata.dominantColor }} />
            <span className="color-value">{metadata.dominantColor}</span>
          </div>
        </div>
      )}

      <div className="metadata-section">
        <h4>质量分析</h4>
        <div className={`quality-badge quality-${quality.level}`}>
          {quality.level === "high" ? "高质量" : quality.level === "medium" ? "中等" : "低质量"}
        </div>
        {quality.suggestions.length > 0 && (
          <ul className="quality-suggestions">
            {quality.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
