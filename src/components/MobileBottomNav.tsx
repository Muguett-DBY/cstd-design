import { MessageCircle } from "lucide-react";
import { TABS } from "../constants";
import type { WorkspaceTab } from "../types";

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenSidebar,
  customLabels,
}: {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onOpenSidebar: () => void;
  customLabels: Record<WorkspaceTab, string>;
}) {
  const labelFor = (tab: (typeof TABS)[number]) => customLabels[tab.id]?.trim() || tab.label;

  return (
    <nav className="mobile-bottom-nav" aria-label="底部工作区导航">
      <button
        type="button"
        className="mobile-bottom-nav-item"
        onClick={onOpenSidebar}
        aria-label="打开会话列表"
      >
        <span className="mobile-bottom-nav-icon"><MessageCircle size={18} /></span>
        <span>会话</span>
      </button>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        const label = labelFor(tab);
        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-bottom-nav-item${selected ? " active" : ""}`}
            aria-current={selected ? "page" : undefined}
            aria-label={selected ? `当前工作区：${label}` : `前往${label}工作区`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="mobile-bottom-nav-icon"><Icon size={18} /></span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
