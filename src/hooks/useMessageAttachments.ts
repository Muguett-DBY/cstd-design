import { useCallback, useState } from "react";

export interface MessageAttachment {
  id: string;
  file: File;
  url: string;
  previewUrl: string;
  type: "image" | "file";
  name: string;
  size: number;
}

export function useMessageAttachments() {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

  const addAttachment = useCallback((file: File) => {
    const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("image/") ? "image" : "file";

    setAttachments((prev) => [
      ...prev,
      { id, file, url, previewUrl: type === "image" ? url : "", type, name: file.name, size: file.size },
    ]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      for (const a of prev) URL.revokeObjectURL(a.url);
      return [];
    });
  }, []);

  return { attachments, addAttachment, removeAttachment, clearAttachments };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
