import { useCallback, useState } from "react";
import { Download, Upload, Database } from "lucide-react";
import { THEMES } from "../hooks/useTheme";

interface BackupData {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

const BACKUP_KEYS = [
  "cstd-design:chat-prompt-templates",
  "cstd-design:video-presets",
  "cstd-design:pinned-conversations",
  "cstd-design:asset-tags",
  "cstd-design:preferences",
  "cstd-design:theme",
  "cstd-design:language",
  "cstd-design:saved-searches",
  "cstd-design:shared-conversations",
  "cstd-design:searchHistory",
  "cstd-design:imageSize",
  "cstd-design:onboarding-completed",
  "cstd-design:dark",
];

export function BackupRestore({ onNotice }: { onNotice: (msg: string) => void }) {
  const [importing, setImporting] = useState(false);

  const handleExport = useCallback(() => {
    try {
      const data: Record<string, unknown> = {};
      for (const key of BACKUP_KEYS) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }
      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cstd-design-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onNotice(`已导出备份文件，包含 ${Object.keys(data).length} 项设置。`);
    } catch {
      onNotice("导出失败。");
    }
  }, [onNotice]);

  const handleImport = useCallback(async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as BackupData;
      if (backup.version !== 1 || typeof backup.data !== "object") {
        throw new Error("invalid format");
      }
      let count = 0;
      for (const [key, value] of Object.entries(backup.data)) {
        if (BACKUP_KEYS.includes(key)) {
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          count++;
        }
      }
      onNotice(`已导入 ${count} 项设置，请刷新页面。`);
    } catch {
      onNotice("导入失败：文件格式无效。");
    } finally {
      setImporting(false);
    }
  }, [onNotice]);

  return (
    <div className="backup-section">
      <h4><Database size={14} /> 备份与恢复</h4>
      <p className="backup-desc">导出所有本地设置（{THEMES.length} 个主题、模板、置顶会话等）到 JSON 文件，或从备份文件恢复。</p>
      <div className="backup-actions">
        <button type="button" className="ghost-button" onClick={handleExport}>
          <Download size={14} /> 导出备份
        </button>
        <label className="ghost-button backup-import-label">
          <Upload size={14} /> {importing ? "导入中..." : "导入备份"}
          <input
            type="file"
            accept="application/json,.json"
            disabled={importing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}
