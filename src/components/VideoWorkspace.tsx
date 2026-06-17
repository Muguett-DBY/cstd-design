import { useEffect, useState } from "react";
import { Film, RefreshCw } from "lucide-react";
import { api } from "../api";
import { filterAssets, imageAssetsForReference, videoPresetToRequest, videoStatusLabel } from "../app-state";
import type { AssetItem, VideoPreset } from "../types";
import { ClearAllButton } from "./ClearAllButton";
import { ReferencePicker } from "./ReferencePicker";
import { PreviewRail } from "./PreviewRail";
import { Segmented } from "./Segmented";

export function VideoWorkspace({ assets, onAssetsChanged, onNotice, onClearAll, onPreview }: { assets: AssetItem[]; onAssetsChanged: () => Promise<void>; onNotice: (message: string) => void; onClearAll: () => Promise<void>; onPreview?: (asset: AssetItem) => void }) {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<VideoPreset>("standard");
  const [fps, setFps] = useState(24);
  const [ratio, setRatio] = useState("1152x768");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState("");
  const [keyframes, setKeyframes] = useState(false);
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [task, setTask] = useState<{ id: string; status: string; progress: number; assetUrl?: string } | null>(null);
  const referenceAssets = imageAssetsForReference(assets);
  const presetInfo = videoPresetToRequest(preset);

  useEffect(() => {
    if (!task || task.status === "completed" || task.status === "failed") return;
    let cancelled = false;
    let consecutiveErrors = 0;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    const timer = window.setInterval(async () => {
      if (cancelled) return;
      try {
        const result = await api.videoTask(task.id);
        if (cancelled) return;
        consecutiveErrors = 0;
        setTask(result.task);
        if (result.task.status === "completed") {
          await onAssetsChanged();
          onNotice("视频已完成并保存到素材库。");
        } else if (result.task.status === "failed") {
          onNotice("视频生成失败。");
        }
      } catch (error) {
        if (!cancelled) {
          consecutiveErrors++;
          if (consecutiveErrors <= 3) {
            onNotice(error instanceof Error ? error.message : "视频查询失败。");
          } else if (consecutiveErrors === 4) {
            onNotice("网络连接不稳定，正在重试...");
          }
        }
      }
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", handler);
    };
  }, [task, onAssetsChanged, onNotice]);

  const [width, height] = ratio.split("x").map(Number);

  return (
    <section className="tool-grid">
      <div className="tool-card">
        <div className="tool-card-heading">
          <h3>生成一个视频</h3>
          <ClearAllButton
            label="清空视频"
            onClear={async () => {
              await onClearAll();
              setTask(null);
              setReferenceIds([]);
            }}
          />
        </div>
        <p>视频生成期间请保持页面打开。关闭页面后任务会被视为放弃。</p>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={creating || (task !== null && task.status !== "failed" && task.status !== "completed")} placeholder="描述画面、动作、镜头和氛围..." />
        <Segmented<VideoPreset>
          value={preset}
          options={[
            ["short", "约 5 秒"],
            ["standard", "约 10 秒"],
            ["max", "拉满"],
          ]}
          onChange={setPreset}
        />
        <div className="field-row">
          <label>
            画幅
            <select value={ratio} onChange={(event) => setRatio(event.target.value)}>
              <option value="1152x768">横版高清</option>
              <option value="768x1152">竖版高清</option>
            </select>
          </label>
          <label>
            FPS
            <input type="number" min={1} max={60} value={fps} onChange={(event) => setFps(Number(event.target.value))} />
          </label>
        </div>
        <details className="advanced">
          <summary>高级选项</summary>
          <input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} placeholder="负面提示词，可选" />
          <input value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="种子，可选" />
          <label className="checkbox-line">
            <input type="checkbox" checked={keyframes} onChange={(event) => setKeyframes(event.target.checked)} />
            使用关键帧模式
          </label>
        </details>
        <ReferencePicker assets={referenceAssets} selected={referenceIds} onChange={setReferenceIds} />
        {task ? (
          <div className="task-card">
            <strong>当前任务：{videoStatusLabel(task.status)}</strong>
            <div className="progress"><span style={{ width: `${task.progress}%` }} /></div>
            <p>{task.progress}% · {presetInfo.numFrames} 帧</p>
            {task.assetUrl && <a href={task.assetUrl} target="_blank" rel="noreferrer">打开视频</a>}
            {task.status !== "completed" && (
              <button type="button" className="ghost-button danger" onClick={async () => {
                try {
                  await api.abandonVideo(task.id);
                  setTask(null);
                } catch (error) { onNotice(error instanceof Error ? error.message : "操作失败。"); }
              }}>
                放弃任务
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="primary-button full"
            disabled={!prompt.trim() || creating}
            onClick={async () => {
              setCreating(true);
              try {
                const result = await api.createVideo({
                  prompt,
                  preset,
                  fps,
                  width,
                  height,
                  referenceAssetIds: referenceIds,
                  keyframes,
                  negativePrompt: negativePrompt || undefined,
                  seed: seed ? Number(seed) : undefined,
                });
                setTask(result.task);
              } catch (error) {
                onNotice(error instanceof Error ? error.message : "视频任务创建失败。");
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? <><RefreshCw size={16} className="spin" /> 创建中...</> : <><Film size={16} /> 创建视频任务</>}
          </button>
        )}
      </div>
      <PreviewRail assets={filterAssets(assets, "video")} title="最近视频" onPreview={onPreview} />
    </section>
  );
}
