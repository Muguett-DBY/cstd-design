import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar, CheckSquare, FileText, FileCode, Printer, Square, X, Eye, Clipboard, BookOpen, Database } from "lucide-react";

const ASSISTANT_NAME = "助手";

type ExportFormat = "markdown" | "html" | "pdf" | "text" | "notion" | "obsidian";
type ExportTemplate = "default" | "minimal" | "professional" | "academic";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  messages: { id?: string; role: string; content: string; status: string; createdAt?: string }[];
}

interface DateRange {
  start: string;
  end: string;
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

function generateMarkdown(title: string, messages: { role: string; content: string; status: string }[]): string {
  const date = new Date().toLocaleString("zh-CN");
  const header = `# ${title}\n\n导出时间：${date}\n\n---\n\n`;
  const body = messages
    .filter((m) => m.status !== "streaming")
    .map((m) => {
      const role = m.role === "user" ? "**你**" : `**${ASSISTANT_NAME}**`;
      return `${role}：\n\n${m.content}\n`;
    })
    .join("\n---\n\n");
  return header + body;
}

function generateText(title: string, messages: { role: string; content: string; status: string }[]): string {
  const date = new Date().toLocaleString("zh-CN");
  const header = `${title}\n导出时间：${date}\n${"=".repeat(40)}\n\n`;
  const body = messages
    .filter((m) => m.status !== "streaming")
    .map((m) => {
      const role = m.role === "user" ? "你" : ASSISTANT_NAME;
      return `[${role}]\n${m.content}\n`;
    })
    .join(`\n${"-".repeat(40)}\n\n`);
  return header + body;
}

function generateNotion(title: string, messages: { role: string; content: string; status: string }[]): string {
  const date = new Date().toLocaleString("zh-CN");
  const header = `# ${title}\n\n> 导出时间：${date}\n\n---\n\n`;
  const body = messages
    .filter((m) => m.status !== "streaming")
    .map((m) => {
      const role = m.role === "user" ? "**👤 你**" : `**🤖 ${ASSISTANT_NAME}**`;
      const content = m.content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          if (line.startsWith("```")) return `\`\`\`\n`;
          if (line.startsWith("- ")) return line;
          if (line.startsWith("* ")) return line;
          if (/^\d+\.\s/.test(line)) return line;
          return `> ${line}`;
        })
        .join("\n");
      return `### ${role}\n\n${content}\n`;
    })
    .join("\n---\n\n");
  return header + body;
}

function generateObsidian(title: string, messages: { role: string; content: string; status: string }[]): string {
  const date = new Date().toLocaleString("zh-CN");
  const tags = ["chat-export", "conversation"];
  const header = `---\ntitle: "${title}"\ndate: ${date}\ntags: [${tags.join(", ")}]\n---\n\n# ${title}\n\n`;
  const body = messages
    .filter((m) => m.status !== "streaming")
    .map((m) => {
      const role = m.role === "user" ? "**你**" : `**${ASSISTANT_NAME}**`;
      const content = m.content
        .replace(/\[\[([^\]]+)\]\]/g, "$1")
        .replace(/^# /gm, "## ");
      return `### ${role}\n\n${content}\n`;
    })
    .join("\n---\n\n");
  return header + body;
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
  const [template, setTemplate] = useState<ExportTemplate>("default");
  const [useDateRange, setUseDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(new Set());
  const [showMessageSelection, setShowMessageSelection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const headingId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const filteredMessages = useMemo(() => {
    let result = messages.filter((m) => m.status !== "streaming");

    if (useDateRange && dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      result = result.filter((m) => {
        if (!m.createdAt) return false;
        const date = new Date(m.createdAt);
        return date >= start && date <= end;
      });
    }

    if (showMessageSelection && selectedMessages.size > 0) {
      result = result.filter((_, index) => selectedMessages.has(index));
    }

    return result;
  }, [messages, useDateRange, dateRange, showMessageSelection, selectedMessages]);

  const allSelected = useMemo(() => {
    const nonStreaming = messages.filter((m) => m.status !== "streaming");
    return nonStreaming.length > 0 && selectedMessages.size === nonStreaming.length;
  }, [messages, selectedMessages]);

  const previewContent = useMemo(() => {
    switch (format) {
      case "markdown":
        return generateMarkdown(title, filteredMessages);
      case "text":
        return generateText(title, filteredMessages);
      default:
        return generateHTML(title, filteredMessages);
    }
  }, [title, filteredMessages, format]);

  const toggleAllMessages = () => {
    const nonStreaming = messages.filter((m) => m.status !== "streaming");
    if (allSelected) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(nonStreaming.map((_, index) => index)));
    }
  };

  const toggleMessage = (index: number) => {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  const handleExport = () => {
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, "_");

    switch (format) {
      case "markdown": {
        const content = generateMarkdown(title, filteredMessages);
        downloadFile(content, `${safeTitle}.md`, "text/markdown;charset=utf-8");
        break;
      }
      case "text": {
        const content = generateText(title, filteredMessages);
        downloadFile(content, `${safeTitle}.txt`, "text/plain;charset=utf-8");
        break;
      }
      case "html": {
        const html = generateHTML(title, filteredMessages);
        downloadFile(html, `${safeTitle}.html`, "text/html;charset=utf-8");
        break;
      }
      case "pdf": {
        const html = generateHTML(title, filteredMessages);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          // Fallback: download as HTML if popup is blocked
          downloadFile(html, `${safeTitle}.html`, "text/html;charset=utf-8");
        }
        break;
      }
      case "notion": {
        const content = generateNotion(title, filteredMessages);
        downloadFile(content, `${safeTitle}.md`, "text/markdown;charset=utf-8");
        break;
      }
      case "obsidian": {
        const content = generateObsidian(title, filteredMessages);
        downloadFile(content, `${safeTitle}.md`, "text/markdown;charset=utf-8");
        break;
      }
    }
    onClose();
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" role="dialog" aria-modal="true" aria-labelledby={headingId} onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3 id={headingId}>导出对话</h3>
          <button type="button" className="export-modal-close" onClick={onClose} aria-label="关闭导出对话框" ref={closeButtonRef}>
            <X size={18} />
          </button>
        </div>
        <div className="export-modal-body">
          <p className="export-modal-title">{title}</p>
          <p className="export-modal-count">{filteredMessages.length} 条消息</p>

          {/* Date Range Selection */}
          <div className="export-option-section">
            <button
              type="button"
              className={`export-option-toggle${useDateRange ? " active" : ""}`}
              onClick={() => setUseDateRange(!useDateRange)}
            >
              <Calendar size={14} />
              {useDateRange ? "关闭日期筛选" : "按日期筛选"}
            </button>
            {useDateRange && (
              <div className="export-date-range">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="export-date-input"
                />
                <span className="export-date-separator">至</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="export-date-input"
                />
              </div>
            )}
          </div>

          {/* Message Selection */}
          <div className="export-option-section">
            <button
              type="button"
              className={`export-option-toggle${showMessageSelection ? " active" : ""}`}
              onClick={() => setShowMessageSelection(!showMessageSelection)}
            >
              <CheckSquare size={14} />
              {showMessageSelection ? "关闭消息选择" : "选择消息"}
            </button>
            {showMessageSelection && (
              <div className="export-message-selection">
                <button
                  type="button"
                  className="export-select-all"
                  onClick={toggleAllMessages}
                >
                  {allSelected ? <Square size={14} /> : <CheckSquare size={14} />}
                  {allSelected ? "取消全选" : "全选"}
                </button>
                <div className="export-message-list">
                  {messages.filter((m) => m.status !== "streaming").map((m, index) => (
                    <label key={index} className="export-message-item">
                      <input
                        type="checkbox"
                        checked={selectedMessages.has(index)}
                        onChange={() => toggleMessage(index)}
                      />
                      <span className="export-message-role">{m.role === "user" ? "你" : ASSISTANT_NAME}</span>
                      <span className="export-message-preview">{m.content.slice(0, 50)}{m.content.length > 50 ? "..." : ""}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Toggle */}
          <div className="export-option-section">
            <button
              type="button"
              className={`export-option-toggle${showPreview ? " active" : ""}`}
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye size={14} />
              {showPreview ? "关闭预览" : "预览导出内容"}
            </button>
            {showPreview && (
              <div className="export-preview">
                <div className="export-preview-header">
                  <span>预览内容</span>
                  <span className="export-preview-count">{filteredMessages.length} 条消息</span>
                </div>
                <div className="export-preview-content">
                  {format === "markdown" ? (
                    <pre className="export-preview-markdown">{previewContent}</pre>
                  ) : (
                    <div
                      className="export-preview-html"
                      dangerouslySetInnerHTML={{ __html: previewContent.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/on\w+="[^"]*"/gi, "") }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div className="export-format-options">
            <button
              type="button"
              className={`export-format-btn${format === "markdown" ? " active" : ""}`}
              onClick={() => setFormat("markdown")}
            >
              <FileText size={20} />
              <span className="export-format-label">Markdown</span>
              <span className="export-format-desc">富文本格式，便于编辑</span>
            </button>
            <button
              type="button"
              className={`export-format-btn${format === "text" ? " active" : ""}`}
              onClick={() => setFormat("text")}
            >
              <Clipboard size={20} />
              <span className="export-format-label">纯文本</span>
              <span className="export-format-desc">纯文本格式，便于复制</span>
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
            <button
              type="button"
              className={`export-format-btn${format === "notion" ? " active" : ""}`}
              onClick={() => setFormat("notion")}
            >
              <Database size={20} />
              <span className="export-format-label">Notion</span>
              <span className="export-format-desc">Notion 兼容格式</span>
            </button>
            <button
              type="button"
              className={`export-format-btn${format === "obsidian" ? " active" : ""}`}
              onClick={() => setFormat("obsidian")}
            >
              <BookOpen size={20} />
              <span className="export-format-label">Obsidian</span>
              <span className="export-format-desc">Obsidian 兼容格式</span>
            </button>
          </div>

          {/* Template Selection */}
          <div className="export-template-options">
            <span className="export-template-label">导出模板：</span>
            <div className="export-template-buttons">
              {(["default", "minimal", "professional", "academic"] as ExportTemplate[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`export-template-btn${template === t ? " active" : ""}`}
                  onClick={() => setTemplate(t)}
                >
                  {t === "default" ? "默认" : t === "minimal" ? "简洁" : t === "professional" ? "专业" : "学术"}
                </button>
              ))}
            </div>
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
