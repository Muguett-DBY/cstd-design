import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { api } from "../api";

export function GlobalDropZone({ onUploaded, onNotice, enabled = true }: { onUploaded: () => Promise<void>; onNotice: (message: string) => void; enabled?: boolean }) {
  const [active, setActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const onDragEnter = (e: DragEvent) => {
      if (hasFiles(e)) {
        e.preventDefault();
        setActive(true);
      }
    };
    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      }
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setActive(false);
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      setActive(false);
      if (!e.dataTransfer) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      setUploading(true);
      try {
        const result = await api.upload(files);
        onNotice(`已上传 ${result.assets.length} 个文件。`);
        await onUploaded();
      } catch (error) {
        onNotice(error instanceof Error ? error.message : "上传失败。");
      } finally {
        setUploading(false);
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [enabled, onUploaded, onNotice]);

  if (!active && !uploading) return null;

  return (
    <div className="global-drop-zone" role="status" aria-live="polite">
      <div className="global-drop-zone-content">
        <Upload size={48} />
        <strong>{uploading ? "上传中..." : "松开以上传文件"}</strong>
        <span>支持图片、视频、文档</span>
      </div>
    </div>
  );
}
