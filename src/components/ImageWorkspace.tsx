import { useState } from "react";
import { CheckCircle2, ImageIcon, RefreshCw, Sparkles } from "lucide-react";
import { api } from "../api";
import { filterAssets, imageAssetsForReference, readStoredImageSize } from "../app-state";
import type { AssetItem, ImageSize } from "../types";
import { ClearAllButton } from "./ClearAllButton";
import { ReferencePicker } from "./ReferencePicker";
import { UploadBox } from "./UploadBox";
import { PreviewRail } from "./PreviewRail";
import { Segmented } from "./Segmented";

const IMAGE_SIZE_STORAGE_KEY = "cstd-design:imageSize";

const STYLE_PRESETS: { id: string; label: string; prefix: string }[] = [
  { id: "none", label: "无风格", prefix: "" },
  { id: "realistic", label: "写实", prefix: "写实摄影风格，" },
  { id: "anime", label: "动漫", prefix: "日本动漫风格，" },
  { id: "oil", label: "油画", prefix: "油画风格，厚重笔触，" },
  { id: "watercolor", label: "水彩", prefix: "水彩画风格，柔和透明，" },
  { id: "sketch", label: "素描", prefix: "铅笔素描风格，" },
];

export function ImageWorkspace({ assets, onAssetsChanged, onNotice, onClearAll, onPreview }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onNotice: (message: string) => void; onClearAll: () => Promise<void>; onPreview?: (asset: AssetItem) => void }) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>(() => readStoredImageSize());
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState("none");
  const [lastResult, setLastResult] = useState<{ url: string; filename: string; prompt: string } | null>(null);
  const referenceAssets = imageAssetsForReference(assets);

  const generate = async () => {
    setLoading(true);
    const finalPrompt = STYLE_PRESETS.find((s) => s.id === style)?.prefix + prompt;
    try {
      localStorage.setItem(IMAGE_SIZE_STORAGE_KEY, size);
      const result = await api.generateImage({ prompt: finalPrompt, size, referenceAssetIds: referenceIds });
      setLastResult({ url: result.asset.url, filename: result.asset.filename, prompt });
      setPrompt("");
      setStyle("none");
      await onAssetsChanged();
      onNotice(`图片已保存到素材库：${result.asset.filename}`);
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
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={loading} maxLength={8000} placeholder="描述你想要的画面..." />
        <div className="style-presets">
          {STYLE_PRESETS.map((p) => (
            <button key={p.id} type="button" className={`style-chip${style === p.id ? " active" : ""}`} onClick={() => setStyle(p.id)}>
              {p.id === "none" ? null : <Sparkles size={12} />} {p.label}
            </button>
          ))}
        </div>
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
          {loading ? <><RefreshCw size={16} className="spin" /> 生成中...</> : <><ImageIcon size={16} /> 生成图片</>}
        </button>
        {lastResult && !loading && (
          <div className="image-result">
            <div className="image-result-header">
              <CheckCircle2 size={16} />
              <span>最近生成</span>
            </div>
            <img src={lastResult.url} alt={lastResult.filename} className="image-result-preview" onClick={() => window.open(lastResult.url, "_blank")} />
            <p className="image-result-prompt">"{lastResult.prompt.slice(0, 60)}{lastResult.prompt.length > 60 ? "..." : ""}"</p>
          </div>
        )}
      </div>
      <PreviewRail assets={filterAssets(assets, "image")} title="最近图片" onPreview={onPreview} />
    </section>
  );
}
