import { useCallback, useState } from "react";
import { Download, Upload, Database, Eye, X, Check } from "lucide-react";
import { THEMES } from "../hooks/useTheme";
import { BACKUP_KEY_LABELS, BACKUP_KEYS } from "../storage-keys";

interface BackupData {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

function formatKey(key: string): string {
  if (BACKUP_KEY_LABELS[key]) return BACKUP_KEY_LABELS[key];
  return key
    .replace("cstd-design:", "")
    .replace(/-/g, " ");
}

function getPreviewInfo(backup: BackupData): { key: string; hasValue: boolean; overwritesExisting: boolean }[] {
  return Object.entries(backup.data)
    .filter(([key]) => BACKUP_KEYS.includes(key))
    .map(([key, value]) => ({
      key: formatKey(key),
      hasValue: value !== null && value !== undefined,
      overwritesExisting: localStorage.getItem(key) !== null,
    }));
}

function validateBackupFile(text: string): { valid: boolean; error?: string; backup?: BackupData } {
  try {
    const backup = JSON.parse(text) as BackupData;
    if (typeof backup !== "object" || backup === null) {
      return { valid: false, error: "无效的备份文件格式" };
    }
    if (backup.version !== 1) {
      return { valid: false, error: "不支持的备份版本" };
    }
    if (typeof backup.data !== "object" || backup.data === null) {
      return { valid: false, error: "备份数据缺失" };
    }
    if (typeof backup.exportedAt !== "string") {
      return { valid: false, error: "缺少导出时间" };
    }
    return { valid: true, backup };
  } catch {
    return { valid: false, error: "无法解析 JSON 文件" };
  }
}

export function BackupRestore({ onNotice }: { onNotice: (msg: string) => void }) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<BackupData | null>(null);

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

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const result = validateBackupFile(text);
      if (!result.valid || !result.backup) {
        onNotice(`导入失败：${result.error}`);
        return;
      }
      setPreview(result.backup);
    };
    reader.onerror = () => onNotice("文件读取失败。");
    reader.readAsText(file);
  }, [onNotice]);

  const confirmImport = useCallback((merge: boolean) => {
    if (!preview) return;
    setImporting(true);
    try {
      let count = 0;
      for (const [key, value] of Object.entries(preview.data)) {
        if (BACKUP_KEYS.includes(key)) {
          if (merge && localStorage.getItem(key) !== null) continue;
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          count++;
        }
      }
      onNotice(`已导入 ${count} 项设置（${merge ? "合并" : "覆盖"}模式），请刷新页面。`);
    } catch {
      onNotice("导入失败。");
    } finally {
      setImporting(false);
      setPreview(null);
    }
  }, [preview, onNotice]);

  const previewItems = preview ? getPreviewInfo(preview) : [];

  return (
    <>
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
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {preview && (
        <div className="preview-overlay" onClick={() => setPreview(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h4><Eye size={16} /> 导入预览</h4>
              <button type="button" className="icon-button" onClick={() => setPreview(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="preview-content">
              <p className="preview-info">
                导出时间：{new Date(preview.exportedAt).toLocaleString("zh-CN")}
              </p>
              <p className="preview-info">
                共 {previewItems.length} 项设置
              </p>
              <div className="preview-items">
                {previewItems.map((item) => (
                  <div key={item.key} className="preview-item">
                    <Check size={14} className="preview-item-icon" />
                    <span className="preview-item-key">{item.key}</span>
                    <span className={`preview-item-status ${item.overwritesExisting ? "is-overwrite" : "is-new"}`}>
                      {item.overwritesExisting ? "将覆盖" : "新增"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="preview-actions">
              <button type="button" className="ghost-button" onClick={() => setPreview(null)}>
                取消
              </button>
              <button type="button" className="secondary-button" onClick={() => confirmImport(true)}>
                合并导入（保留现有）
              </button>
              <button type="button" className="primary-button" onClick={() => confirmImport(false)}>
                覆盖导入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
