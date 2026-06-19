import { CheckCircle2, Image as ImageIcon, Film } from "lucide-react";
import type { ReactNode } from "react";

interface ResultCardProps {
  type: "image" | "video";
  mediaUrl: string;
  filename: string;
  prompt?: string;
  onPreview?: () => void;
  onDownload?: () => void;
  metadata?: ReactNode;
}

export function ResultCard({ type, mediaUrl, filename, prompt, onPreview, onDownload, metadata }: ResultCardProps) {
  const Icon = type === "image" ? CheckCircle2 : Film;
  const label = type === "image" ? "最近生成图片" : "最近生成视频";

  return (
    <div className="result-card">
      <div className="result-card-header">
        <Icon size={16} />
        <span>{label}</span>
        {metadata && <span className="result-card-meta">{metadata}</span>}
      </div>
      <div
        className="result-card-media"
        onClick={onPreview}
        onKeyDown={(e) => { if (onPreview && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPreview(); } }}
        role={onPreview ? "button" : undefined}
        tabIndex={onPreview ? 0 : undefined}
        aria-label={onPreview ? `预览 ${filename}` : undefined}
      >
        {type === "image" ? (
          <img src={mediaUrl} alt={filename} className="result-card-preview" />
        ) : (
          <video src={mediaUrl} controls className="result-card-preview" />
        )}
      </div>
      {prompt && <p className="result-card-prompt">"{prompt.slice(0, 60)}{prompt.length > 60 ? "..." : ""}"</p>}
      {onDownload && (
        <a href={`${mediaUrl}?download=1`} className="result-card-download" download={filename}>
          <ImageIcon size={14} /> 下载 {type === "image" ? "图片" : "视频"}
        </a>
      )}
    </div>
  );
}
