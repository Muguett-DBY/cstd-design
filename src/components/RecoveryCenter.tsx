import { useState } from "react";
import { RotateCcw, Trash2, X } from "lucide-react";
import type { CreationRecoveryRecord } from "../hooks/useCreationRecovery";

function recoveryTypeLabel(type: CreationRecoveryRecord["type"]) {
  if (type === "chat") return "咨询";
  if (type === "image") return "图片";
  return "视频";
}

function formatRecoveryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function RecoveryCenter({
  records,
  onSelect,
  onDismiss,
  onClear,
}: {
  records: CreationRecoveryRecord[];
  onSelect: (record: CreationRecoveryRecord) => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="recovery-center">
      <button
        type="button"
        className="recovery-trigger"
        aria-label={`恢复中心，${records.length} 个待处理项`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <RotateCcw size={16} />
        <span>恢复中心</span>
        <span className="recovery-badge">{records.length}</span>
      </button>
      {open && (
        <section className="recovery-panel" role="dialog" aria-label="恢复中心">
          <div className="recovery-panel-header">
            <div>
              <h3>恢复中心</h3>
              <p>失败或中断的创作参数保存在本机，可切回对应工作区继续处理。</p>
            </div>
            <button type="button" className="icon-button" aria-label="关闭恢复中心" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          {records.length === 0 ? (
            <p className="recovery-empty">暂无需要恢复的创作任务。</p>
          ) : (
            <>
              <div className="recovery-list" role="list">
                {records.map((record) => (
                  <article key={record.id} className="recovery-item" role="listitem">
                    <div>
                      <span className="recovery-kind">{recoveryTypeLabel(record.type)}</span>
                      <h4>{record.label}</h4>
                      <p>{record.summary}</p>
                      <time dateTime={record.createdAt}>{formatRecoveryTime(record.createdAt)}</time>
                    </div>
                    <div className="recovery-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        aria-label={`打开 ${record.label}`}
                        onClick={() => {
                          onSelect(record);
                          setOpen(false);
                        }}
                      >
                        打开
                      </button>
                      <button
                        type="button"
                        className="ghost-button danger"
                        aria-label={`忽略 ${record.label}`}
                        onClick={() => onDismiss(record.id)}
                      >
                        忽略
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <button type="button" className="ghost-button danger recovery-clear" aria-label="清空恢复记录" onClick={onClear}>
                <Trash2 size={14} /> 清空恢复记录
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
