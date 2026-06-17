import { useState } from "react";
import { FileText, FileCode, Printer, X } from "lucide-react";

const ASSISTANT_NAME = "助手";

type ExportFormat = "markdown" | "html" | "pdf";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  messages: { role: string; content: string; status: string }[];
}

function generateHTML(title: string, messages: { role: string; content: string; status: string }[]): string {
  const date = new Date().toLocaleString("zh-CN");
  const messageHTML = messages
    .filter((m) => m.status !== "streaming")
    .map((m) => {
      const role = m.role === "user" ? "你" : ASSISTANT_NAME;
      const roleClass = m.role === "user" ? "user" : "assistant";
      return `
        <div class="message ${roleClass}">
          <div class="role">${role}</div>
          <div class="content">${escapeHTML(m.content)}</div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    .message { margin-bottom: 20px; padding: 16px; border-radius: 12px; }
    .message.user { background: #f0f7ff; border-left: 3px solid #3b82f6; }
    .message.assistant { background: #f9fafb; border-left: 3px solid #10b981; }
    .role { font-weight: 600; margin-bottom: 6px; font-size: 14px; }
    .user .role { color: #3b82f6; }
    .assistant .role { color: #10b981; }
    .content { white-space: pre-wrap; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${escapeHTML(title)}</h1>
  <div class="meta">导出时间：${date} · ${messages.filter((m) => m.status !== "streaming").length} 条消息</div>
  ${messageHTML}
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportModal({ isOpen, onClose, title, messages }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");

  if (!isOpen) return null;

  const handleExport = () => {
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, "_");
    const date = new Date().toLocaleString("zh-CN");

    switch (format) {
      case "markdown": {
        const header = `# ${title}\n\n导出时间：${date}\n\n---\n\n`;
        const body = messages
          .filter((m) => m.status !== "streaming")
          .map((m) => {
            const role = m.role === "user" ? "**你**" : `**${ASSISTANT_NAME}**`;
            return `${role}：\n\n${m.content}\n`;
          })
          .join("\n---\n\n");
        downloadFile(header + body, `${safeTitle}.md`, "text/markdown;charset=utf-8");
        break;
      }
      case "html": {
        const html = generateHTML(title, messages);
        downloadFile(html, `${safeTitle}.html`, "text/html;charset=utf-8");
        break;
      }
      case "pdf": {
        const html = generateHTML(title, messages);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        break;
      }
    }
    onClose();
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>导出对话</h3>
          <button type="button" className="export-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="export-modal-body">
          <p className="export-modal-title">{title}</p>
          <p className="export-modal-count">{messages.filter((m) => m.status !== "streaming").length} 条消息</p>
          <div className="export-format-options">
            <button
              type="button"
              className={`export-format-btn${format === "markdown" ? " active" : ""}`}
              onClick={() => setFormat("markdown")}
            >
              <FileText size={20} />
              <span className="export-format-label">Markdown</span>
              <span className="export-format-desc">纯文本格式，便于编辑</span>
            </button>
            <button
              type="button"
              className={`export-format-btn${format === "html" ? " active" : ""}`}
              onClick={() => setFormat("html")}
            >
              <FileCode size={20} />
              <span className="export-format-label">HTML</span>
              <span className="export-format-desc">网页格式，保留样式</span>
            </button>
            <button
              type="button"
              className={`export-format-btn${format === "pdf" ? " active" : ""}`}
              onClick={() => setFormat("pdf")}
            >
              <Printer size={20} />
              <span className="export-format-label">PDF</span>
              <span className="export-format-desc">打印为 PDF 文件</span>
            </button>
          </div>
        </div>
        <div className="export-modal-footer">
          <button type="button" className="ghost-button" onClick={onClose}>取消</button>
          <button type="button" className="primary-button" onClick={handleExport}>导出</button>
        </div>
      </div>
    </div>
  );
}
