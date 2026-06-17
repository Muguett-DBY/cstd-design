import { LogOut, Moon, Sun } from "lucide-react";

const APP_NAME = "工作台";

export function UserFooter({ dark, onThemeToggle, onLogout }: { dark: boolean; onThemeToggle: () => void; onLogout: () => void | Promise<void> }) {
  return (
    <div className="user-footer">
      <div className="mini-brand">
        <img src="/brand/mascot.png" alt="" />
        <span>{APP_NAME}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" className="icon-button" onClick={onThemeToggle} aria-label={dark ? "切换到浅色" : "切换到深色"}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button type="button" className="icon-button" onClick={onLogout} aria-label="退出登录">
          <LogOut size={17} />
        </button>
      </div>
    </div>
  );
}
