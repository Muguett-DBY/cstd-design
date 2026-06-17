import { useState } from "react";
import { ImageIcon, RefreshCw } from "lucide-react";
import { api } from "../api";
import { filterAssets, imageAssetsForReference, readStoredImageSize } from "../app-state";
import type { AssetItem, ImageSize } from "../types";
import { ClearAllButton } from "./ClearAllButton";
import { ReferencePicker } from "./ReferencePicker";
import { UploadBox } from "./UploadBox";
import { PreviewRail } from "./PreviewRail";
import { Segmented } from "./Segmented";

const IMAGE_SIZE_STORAGE_KEY = "cstd-design:imageSize";

export function ImageWorkspace({ assets, onAssetsChanged, onNotice, onClearAll, onPreview }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onNotice: (message: string) => void; onClearAll: () => Promise<void>; onPreview?: (asset: AssetItem) => void }) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>(() => readStoredImageSize());
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const referenceAssets = imageAssetsForReference(assets);

  const generate = async () => {
    setLoading(true);
    try {
      localStorage.setItem(IMAGE_SIZE_STORAGE_KEY, size);
      const result = await api.generateImage({ prompt, size, referenceAssetIds: referenceIds });
      onNotice(`图片已保存到素材库：${result.asset.filename}`);
      setPrompt("");
      await onAssetsChanged();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "图片生成失败。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-grid">
      <div className="tool-card">
        <div className="tool-card-heading">
          <h3>生成一张图片</h3>
          <ClearAllButton label="清空图片" onClear={async () => {
            await onClearAll();
            setReferenceIds([]);
          }} />
        </div>
        <p>每次生成 1 张。选择参考图时会走图生图或多图合成。</p>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={loading} placeholder="描述你想要的画面..." />
        <Segmented<ImageSize>
          value={size}
          options={[
            ["1024x1024", "正方形"],
            ["1024x768", "横版"],
            ["768x1024", "竖版"],
          ]}
          onChange={setSize}
        />
        <ReferencePicker assets={referenceAssets} selected={referenceIds} onChange={setReferenceIds} />
        <UploadBox onUploaded={onAssetsChanged} onNotice={onNotice} />
        <button type="button" className="primary-button full" onClick={generate} disabled={loading || !prompt.trim()}>
          {loading ? <RefreshCw size={16} className="spin" /> : <ImageIcon size={16} />} {loading ? "生成中..." : "生成图片"}
        </button>
      </div>
      <PreviewRail assets={filterAssets(assets, "image")} title="最近图片" onPreview={onPreview} />
    </section>
  );
}
