import { useRef, useState } from "react";
import { Check, RefreshCw, Upload, X } from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 4;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "video/mp4"];

interface PendingFile {
  file: File;
  error?: string;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `不支持的文件类型: ${file.type || "未知"}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `文件过大: ${(file.size / 1024 / 1024).toFixed(1)}MB (最大 50MB)`;
  }
  return null;
}

function uploadWithProgress(
  files: File[],
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<{ assets: { id: string }[] }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const file of files) form.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else if (xhr.status === 401) {
        reject(new Error("请先登录。"));
      } else if (xhr.status === 429) {
        reject(new Error("请求过于频繁，请稍后重试。"));
      } else {
        const body = xhr.response;
        reject(new Error(body?.error || "上传失败。"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("网络连接失败，请检查网络后重试。")));
    xhr.addEventListener("abort", () => reject(new Error("上传已取消。")));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(form);
  });
}

export function UploadBox({ onUploaded, onNotice }: { onUploaded: () => Promise<void>; onNotice: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || uploading) return;

    const raw = Array.from(fileList).slice(0, MAX_FILES);
    const validated: PendingFile[] = raw.map((file) => ({
      file,
      error: validateFile(file) || undefined,
    }));

    const validFiles = validated.filter((f) => !f.error);
    const errorCount = validated.length - validFiles.length;

    if (errorCount > 0) {
      const errorMsg = validated.filter((f) => f.error).map((f) => f.error).join("; ");
      onNotice(errorMsg);
    }

    if (validFiles.length === 0) return;

    if (validFiles.length < raw.length) {
      onNotice(`已过滤 ${raw.length - validFiles.length} 个无效文件`);
    }

    setUploading(true);
    setProgress(0);
    setShowSummary(false);

    abortRef.current = new AbortController();

    try {
      const result = await uploadWithProgress(
        validFiles.map((f) => f.file),
        setProgress,
        abortRef.current.signal,
      );
      const count = result?.assets?.length || validFiles.length;
      setUploadedCount(count);
      setShowSummary(true);
      setProgress(100);
      await onUploaded();
      onNotice(`${count} 个文件上传成功。`);
    } catch (error) {
      if (error instanceof Error && error.message === "上传已取消。") {
        onNotice("上传已取消。");
      } else {
        onNotice(error instanceof Error ? error.message : "上传失败。");
      }
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="upload-area">
      <button
        type="button"
        className={"upload-box" + (dragging ? " drag-over" : "") + (uploading ? " uploading" : "")}
        disabled={uploading}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading && event.dataTransfer.types.includes("Files")) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setDragging(false);
          await processFiles(event.dataTransfer.files);
        }}
      >
        {uploading ? (
          <>
            <RefreshCw size={18} className="spin" />
            <span>上传中... {progress}%</span>
            <button
              type="button"
              className="upload-cancel-btn"
              onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
              title="取消上传"
            >
              <X size={14} />
            </button>
          </>
        ) : showSummary ? (
          <>
            <Check size={18} className="upload-success-icon" />
            <span>{uploadedCount} 个文件已上传</span>
          </>
        ) : (
          <>
            <Upload size={18} />
            <span>{dragging ? "松开以上传" : "上传参考图/视频"}</span>
          </>
        )}
        <input ref={inputRef} hidden type="file" accept={ALLOWED_TYPES.join(",")} multiple onChange={(event) => processFiles(event.target.files)} />
      </button>
      {uploading && (
        <div className="upload-progress-bar">
          <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
