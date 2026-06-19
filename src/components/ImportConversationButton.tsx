import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { parseImportedConversation, type ImportedConversation } from "../utils/importConversation";

export function ImportConversationButton({
  onImport,
  onNotice,
}: {
  onImport: (data: ImportedConversation) => Promise<void> | void;
  onNotice: (msg: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = parseImportedConversation(text);
      if (data.messages.length === 0) {
        onNotice("未找到有效的消息内容。");
        return;
      }
      await onImport(data);
      onNotice(`已导入 ${data.messages.length} 条消息。`);
    } catch {
      onNotice("导入失败：文件格式无效。");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ghost-button"
        disabled={importing}
        onClick={() => fileInputRef.current?.click()}
        title="从 JSON 或 Markdown 文件导入对话"
      >
        <Upload size={14} /> {importing ? "导入中..." : "导入对话"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.md,.markdown,application/json,text/markdown,text/plain"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

