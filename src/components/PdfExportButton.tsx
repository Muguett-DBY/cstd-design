import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { generateChatPdf } from "../utils/pdfExport";

export function PdfExportButton({
  title,
  messages,
  onNotice,
}: {
  title: string;
  messages: { role: string; content: string; createdAt?: string }[];
  onNotice: (msg: string) => void;
}) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      const blob = generateChatPdf(title, messages);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (title || "conversation").replace(/[\\/:*?"<>|]/g, "_").slice(0, 64);
      a.download = `${safeTitle}.pdf`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onNotice("已导出为 PDF 文件。");
    } catch {
      onNotice("PDF 导出失败，请重试。");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
      className="ghost-button"
      onClick={handleExport}
      disabled={generating || messages.length === 0}
      title="导出为 PDF 文件"
    >
      {generating ? <FileText size={16} /> : <Download size={16} />} 导出 PDF
    </button>
  );
}
