import { X, FileText } from "lucide-react";
import type { MessageAttachment } from "../hooks/useMessageAttachments";
import { formatFileSize } from "../hooks/useMessageAttachments";

interface AttachmentPreviewProps {
  attachments: MessageAttachment[];
  onRemove: (id: string) => void;
  readonly?: boolean;
}

export function AttachmentPreview({ attachments, onRemove, readonly }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="attachment-preview-list" role="list" aria-label="附件预览">
      {attachments.map((att) => (
        <div key={att.id} className="attachment-preview-item" role="listitem">
          {att.type === "image" ? (
            <img src={att.previewUrl} alt={att.name} className="attachment-preview-image" />
          ) : (
            <div className="attachment-preview-file">
              <FileText size={20} />
            </div>
          )}
          <div className="attachment-preview-info">
            <span className="attachment-preview-name">{att.name}</span>
            <span className="attachment-preview-size">{formatFileSize(att.size)}</span>
          </div>
          {!readonly && (
            <button
              type="button"
              className="attachment-preview-remove"
              onClick={() => onRemove(att.id)}
              aria-label={`移除 ${att.name}`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
