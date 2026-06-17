import { MessageCircle } from "lucide-react";
import { TABS } from "../constants";
import type { WorkspaceTab } from "../types";

export function TopBar({ activeTab, onTabChange, onOpenSidebar }: { activeTab: WorkspaceTab; onTabChange: (tab: WorkspaceTab) => void; onOpenSidebar: () => void }) {
  const active = TABS.find((tab) => tab.id === activeTab);
  return (
    <header className="top-bar">
      <button type="button" className="mobile-menu-button" onClick={onOpenSidebar}>
        <MessageCircle size={18} />
        会话
      </button>
      <div>
        <h2>{active?.label || "咨询"}</h2>
        <p>{activeTab === "chat" ? "安静地问，清楚地答。" : activeTab === "image" ? "输入想法，生成一张图。" : activeTab === "video" ? "页面保持打开，等待视频完成。" : "管理你的上传和作品。"}</p>
      </div>
      <div className="top-actions">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? "chip active" : "chip"} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
