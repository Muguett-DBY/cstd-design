import { MessageCircle } from "lucide-react";
import { TABS } from "../constants";
import type { WorkspaceTab } from "../types";

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenSidebar,
}: {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onOpenSidebar: () => void;
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="底部工作区导航">
      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={onOpenSidebar}
        aria-label="打开会话列表"
      >
        <MessageCircle size={18} />
        <span>会话</span>
      </button>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-bottom-nav-item${selected ? " active" : ""}`}
            aria-current={selected ? "page" : undefined}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

