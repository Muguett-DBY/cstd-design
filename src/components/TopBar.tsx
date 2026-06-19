import { MessageCircle } from "lucide-react";
import { TABS } from "../constants";
import type { WorkspaceTab } from "../types";
import type { TranslationKey } from "../hooks/useLanguage";

const TAB_LABELS: Record<WorkspaceTab, TranslationKey> = {
  chat: "nav.chat",
  image: "nav.image",
  video: "nav.video",
  assets: "nav.assets",
};

const TAB_DESCS: Record<WorkspaceTab, TranslationKey> = {
  chat: "topbar.chatDesc",
  image: "topbar.imageDesc",
  video: "topbar.videoDesc",
  assets: "topbar.assetsDesc",
};

export function TopBar({ activeTab, onTabChange, onOpenSidebar, t }: { activeTab: WorkspaceTab; onTabChange: (tab: WorkspaceTab) => void; onOpenSidebar: () => void; t: (key: TranslationKey) => string }) {
  const active = TABS.find((tab) => tab.id === activeTab);
  const description = t(TAB_DESCS[activeTab]);
  return (
    <header className="top-bar">
      <button type="button" className="mobile-menu-button" aria-label="打开会话列表" onClick={onOpenSidebar}>
        <MessageCircle size={18} />
        会话
      </button>
      <div className="top-bar-copy">
        <h2>{active ? t(TAB_LABELS[active.id]) : t("nav.chat")}</h2>
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
              {t(TAB_LABELS[tab.id])}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
