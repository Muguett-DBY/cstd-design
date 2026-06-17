import { useRef, useState } from "react";
import { RefreshCw, Upload } from "lucide-react";
import { api } from "../api";

export function UploadBox({ onUploaded, onNotice }: { onUploaded: () => Promise<void>; onNotice: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    setUploading(true);
    try {
      await api.upload(Array.from(files).slice(0, 4));
      await onUploaded();
      onNotice("参考素材已上传。");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <button
      type="button"
      className={"upload-box" + (dragging ? " drag-over" : "")}
      disabled={uploading}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => { event.preventDefault(); if (!uploading) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setDragging(false);
        await upload(event.dataTransfer.files);
      }}
    >
      {uploading ? <RefreshCw size={18} className="spin" /> : <Upload size={18} />}
      {uploading ? "上传中..." : dragging ? "松开以上传" : "上传参考图/视频"}
      <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,video/mp4" multiple onChange={(event) => upload(event.target.files)} />
    </button>
  );
}
