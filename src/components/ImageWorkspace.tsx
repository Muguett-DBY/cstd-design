import { useState } from "react";
import { FileText, ImageIcon, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { api } from "../api";
import { filterAssets, imageAssetsForReference, readStoredImageSize } from "../app-state";
import { usePromptTemplates } from "../hooks/usePromptTemplates";
import type { AssetItem, ImageSize } from "../types";
import { ClearAllButton } from "./ClearAllButton";
import { ReferencePicker } from "./ReferencePicker";
import { UploadBox } from "./UploadBox";
import { PreviewRail } from "./PreviewRail";
import { ResultCard } from "./ResultCard";
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

export function ImageWorkspace({ assets, onAssetsChanged, onNotice, onClearAll, onPreview, online }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onNotice: (message: string) => void; onClearAll: () => Promise<void>; onPreview?: (asset: AssetItem) => void; online: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>(() => readStoredImageSize());
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState("none");
  const [lastResult, setLastResult] = useState<{ url: string; filename: string; prompt: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { templates, save, remove } = usePromptTemplates();
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

        {/* Prompt Templates Section */}
        {prompt.trim() && (
          <div className="template-actions">
            <button type="button" className="ghost-button" onClick={() => {
              const name = prompt.trim().slice(0, 30);
              save(name, prompt);
              onNotice(`模板"${name}"已保存。`);
            }}>
              <Save size={14} /> 保存为模板
            </button>
            <button type="button" className="ghost-button" onClick={() => setShowTemplates(!showTemplates)}>
              <FileText size={14} /> {showTemplates ? "收起模板" : "使用模板"}
            </button>
          </div>
        )}

        {showTemplates && (
          <div className="template-list">
            {templates.length === 0 ? (
              <p className="template-empty">暂无保存的模板。输入提示词后点击"保存为模板"。</p>
            ) : (
              templates.map((t) => (
                <div key={t.id} className="template-item">
                  <button type="button" className="template-name" onClick={() => { setPrompt(t.prompt); setShowTemplates(false); }}>
                    <span>{t.name}</span>
                  </button>
                  <button type="button" className="template-delete" onClick={() => remove(t.id)} aria-label="删除模板">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={loading} maxLength={8000} placeholder="描述你想要的画面..." />
        <div className="char-count">{prompt.length}/8000</div>
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
        <button type="button" className="primary-button full" onClick={generate} disabled={loading || !prompt.trim() || !online}>
          {loading ? <><RefreshCw size={16} className="spin" /> 生成中...</> : <><ImageIcon size={16} /> 生成图片</>}
        </button>
        {lastResult && !loading && (
          <ResultCard
            type="image"
            mediaUrl={lastResult.url}
            filename={lastResult.filename}
            prompt={lastResult.prompt}
            onPreview={() => window.open(lastResult.url, "_blank")}
            onRegenerate={() => {
              const lastAsset = assets.find((a) => a.url === lastResult.url);
              if (lastAsset) {
                setReferenceIds([lastAsset.id]);
                setPrompt(lastResult.prompt);
              }
              onNotice("已选择上次结果作为参考图，可调整提示词后重新生成。");
            }}
            metadata={lastResult.filename}
          />
        )}
      </div>
      <PreviewRail assets={filterAssets(assets, "image")} title="最近图片" onPreview={onPreview} />
    </section>
  );
}
