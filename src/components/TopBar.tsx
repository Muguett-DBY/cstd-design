import { MessageCircle } from "lucide-react";
import { TABS } from "../constants";
import type { WorkspaceTab } from "../types";

export function TopBar({ activeTab, onTabChange, onOpenSidebar }: { activeTab: WorkspaceTab; onTabChange: (tab: WorkspaceTab) => void; onOpenSidebar: () => void }) {
  const active = TABS.find((tab) => tab.id === activeTab);
  const description = activeTab === "chat" ? "安静地问，清楚地答。" : activeTab === "image" ? "输入想法，生成一张图。" : activeTab === "video" ? "页面保持打开，等待视频完成。" : "管理你的上传和作品。";
  return (
    <header className="top-bar">
      <button type="button" className="mobile-menu-button" aria-label="打开会话列表" onClick={onOpenSidebar}>
        <MessageCircle size={18} />
        会话
      </button>
      <div className="top-bar-copy">
        <h2>{active?.label || "咨询"}</h2>
        <p>{description}</p>
      </div>
      <nav className="top-actions" aria-label="工作区切换">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={selected ? "chip active" : "chip"}
              aria-current={selected ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
