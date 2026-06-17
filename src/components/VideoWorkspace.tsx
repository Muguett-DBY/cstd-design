import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Film, Hourglass, RefreshCw, XCircle } from "lucide-react";
import { api } from "../api";
import { filterAssets, imageAssetsForReference, videoPresetToRequest, videoStatusLabel } from "../app-state";
import type { AssetItem, VideoPreset } from "../types";
import { ClearAllButton } from "./ClearAllButton";
import { ReferencePicker } from "./ReferencePicker";
import { PreviewRail } from "./PreviewRail";
import { Segmented } from "./Segmented";

const STATUS_ICONS: Record<string, typeof Clock> = {
  queued: Hourglass,
  in_progress: RefreshCw,
  completed: CheckCircle2,
  failed: XCircle,
};

function TaskStatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] || Clock;
  return <span className={`task-status-badge task-status-${status}`}><Icon size={14} /> {videoStatusLabel(status)}</span>;
}

type VideoTask = { id: string; status: string; progress: number; assetUrl?: string };

export function VideoWorkspace({ assets, onAssetsChanged, onNotice, onClearAll, onPreview, videoTask, onVideoTaskChange, submittedPrompt, onSubmittedPromptChange }: {
  assets: AssetItem[];
  onAssetsChanged: () => Promise<void>;
  onNotice: (message: string) => void;
  onClearAll: () => Promise<void>;
  onPreview?: (asset: AssetItem) => void;
  videoTask: VideoTask | null;
  onVideoTaskChange: (task: VideoTask | null) => void;
  submittedPrompt: string;
  onSubmittedPromptChange: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<VideoPreset>("standard");
  const [fps, setFps] = useState(24);
  const [ratio, setRatio] = useState("1152x768");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState("");
  const [keyframes, setKeyframes] = useState(false);
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const errorCountRef = useRef(0);
  const referenceAssets = imageAssetsForReference(assets);
  const presetInfo = videoPresetToRequest(preset);

  useEffect(() => {
    if (!videoTask || videoTask.status === "completed" || videoTask.status === "failed") return;
    let cancelled = false;
    errorCountRef.current = 0;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    const timer = window.setInterval(async () => {
      if (cancelled) return;
      try {
        const result = await api.videoTask(videoTask.id);
        if (cancelled) return;
        errorCountRef.current = 0;
        onVideoTaskChange(result.task);
        if (result.task.status === "completed") {
          await onAssetsChanged();
          onNotice("视频已完成并保存到素材库。");
        } else if (result.task.status === "failed") {
          onNotice("视频生成失败。");
        }
      } catch {
        if (!cancelled) {
          errorCountRef.current++;
          if (errorCountRef.current === 4) onNotice("网络连接不稳定，正在重试...");
          else if (errorCountRef.current >= 10) {
            onNotice("连接超时，请刷新页面重试。");
            cancelled = true;
            window.clearInterval(timer);
            window.removeEventListener("beforeunload", handler);
          }
        }
      }
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", handler);
    };
  }, [videoTask, onAssetsChanged, onNotice, onVideoTaskChange]);

  const [width, height] = ratio.split("x").map(Number);

  const progressPercent = videoTask?.status === "in_progress" ? Math.max(5, Math.min(95, videoTask.progress)) : videoTask?.status === "queued" ? 2 : videoTask?.status === "completed" ? 100 : videoTask?.progress || 0;

  return (
    <section className="tool-grid">
      <div className="tool-card">
        <div className="tool-card-heading">
          <h3>生成一个视频</h3>
          <ClearAllButton
            label="清空视频"
            onClear={async () => {
              await onClearAll();
              onVideoTaskChange(null);
              onSubmittedPromptChange("");
              setReferenceIds([]);
            }}
          />
        </div>
        <p>视频生成期间请保持页面打开。关闭页面后任务会被视为放弃。</p>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={8000} disabled={creating || (videoTask !== null && videoTask.status !== "failed" && videoTask.status !== "completed")} placeholder="描述画面、动作、镜头和氛围..." />
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
        {videoTask ? (
          <div className="task-card">
            <div className="task-card-header">
              <TaskStatusBadge status={videoTask.status} />
              {videoTask.status === "in_progress" && <span className="task-estimate">约 {presetInfo.approxSeconds} 秒</span>}
            </div>
            {submittedPrompt && <p className="task-prompt">"{submittedPrompt.slice(0, 60)}{submittedPrompt.length > 60 ? "..." : ""}"</p>}
            <div className="progress"><span style={{ width: `${progressPercent}%` }} className={`progress-bar progress-${videoTask.status}`} /></div>
            <p className="task-meta">{progressPercent}% · {presetInfo.numFrames} 帧{presetInfo.preset === "max" ? " · 较长" : presetInfo.preset === "short" ? " · 较短" : ""}</p>
            {videoTask.assetUrl && (
              <div className="task-result">
                <video src={videoTask.assetUrl} controls className="task-video-preview" />
              </div>
            )}
            {videoTask.status !== "completed" && (
              <button type="button" className="ghost-button danger" onClick={async () => {
                try {
                  await api.abandonVideo(videoTask.id);
                  onVideoTaskChange(null);
                  onSubmittedPromptChange("");
                } catch (error) { onNotice(error instanceof Error ? error.message : "操作失败。"); }
              }}>
                <XCircle size={14} /> 放弃任务
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
              onSubmittedPromptChange(prompt);
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
                onVideoTaskChange(result.task);
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
