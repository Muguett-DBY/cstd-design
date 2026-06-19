import type { ReactNode } from "react";
import {
  CheckSquare, Folder, Image as ImageIcon, MessageSquare, Search, Sparkles, Upload, Video,
} from "lucide-react";

export function EmptyState({ title, text, children, icon }: { title: string; text: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon || <img src="/brand/mascot.png" alt="" />}
      <strong>{title}</strong>
      <span>{text}</span>
      {children}
    </div>
  );
}

export function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-loader">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-avatar" />
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatEmptyState() {
  return (
    <div className="empty-state enhanced">
      <div className="empty-state-illustration">
        <MessageSquare size={48} strokeWidth={1.5} />
      </div>
      <strong>开始你的第一次对话</strong>
      <span>输入问题、想法或任务描述，助手会给出回答。所有会话都保留在你的本地工作区。</span>
      <ul className="empty-state-suggestions">
        <li><span>💡</span> 帮我写一段产品介绍文案</li>
        <li><span>🔍</span> 解释一下这段代码的逻辑</li>
        <li><span>✨</span> 给这个项目起 3 个候选名字</li>
      </ul>
    </div>
  );
}

export function NoSearchResultsState({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <div className="empty-state enhanced">
      <div className="empty-state-illustration">
        <Search size={48} strokeWidth={1.5} />
      </div>
      <strong>没有找到与 "{query}" 相关的结果</strong>
      <span>试试调整关键词、检查拼写，或者清除筛选条件。</span>
      {onClear && (
        <button type="button" className="ghost-button" onClick={onClear}>
          清除筛选
        </button>
      )}
    </div>
  );
}

export function NoConversationsState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="empty-state enhanced">
      <div className="empty-state-illustration">
        <MessageSquare size={48} strokeWidth={1.5} />
      </div>
      <strong>还没有会话</strong>
      <span>开始一个对话来记录你的想法、问题或项目讨论。</span>
      {onCreate && (
        <button type="button" className="primary-button" onClick={onCreate}>
          <Sparkles size={16} /> 新建会话
        </button>
      )}
    </div>
  );
}

export function NoAssetsState({ onUpload, kind }: { onUpload?: () => void; kind?: "image" | "video" | "upload" }) {
  const labels = { image: "图片", video: "视频", upload: "上传" };
  const label = kind ? labels[kind] : "素材";
  return (
    <div className="empty-state enhanced">
      <div className="empty-state-illustration">
        {kind === "video" ? <Video size={48} strokeWidth={1.5} /> : kind === "image" ? <ImageIcon size={48} strokeWidth={1.5} /> : <Folder size={48} strokeWidth={1.5} />}
      </div>
      <strong>还没有{label}</strong>
      <span>生成或上传{label}后，它们会出现在这里。</span>
      <ul className="empty-state-suggestions">
        <li><span>📤</span> 拖放文件到任意位置</li>
        <li><span>🖼️</span> 前往图片工作区生成</li>
        <li><span>🎬</span> 前往视频工作区生成</li>
      </ul>
      {onUpload && (
        <button type="button" className="primary-button" onClick={onUpload}>
          <Upload size={16} /> 上传文件
        </button>
      )}
    </div>
  );
}

export function NoSelectionState({ onSelectAll }: { onSelectAll?: () => void }) {
  return (
    <div className="empty-state enhanced">
      <div className="empty-state-illustration">
        <CheckSquare size={48} strokeWidth={1.5} />
      </div>
      <strong>请先选择内容</strong>
      <span>勾选一条或多条消息、素材或会话，然后这里会出现可用的批量操作。</span>
      {onSelectAll && (
        <button type="button" className="ghost-button" onClick={onSelectAll}>
          全选可见项
        </button>
      )}
    </div>
  );
}
