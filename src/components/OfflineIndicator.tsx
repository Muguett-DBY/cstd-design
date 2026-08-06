import { Wifi, WifiOff } from "lucide-react";
import { useServiceWorker } from "../hooks/useServiceWorker";

export function OfflineIndicator() {
  const { isOnline, isOfflineReady } = useServiceWorker();

  if (isOnline) return null;

  return (
    <div className="offline-indicator" role="status" aria-live="polite">
      <WifiOff size={14} />
      <span>离线模式</span>
      {isOfflineReady && <span className="offline-hint">（应用界面已缓存，私人数据需联网）</span>}
    </div>
  );
}

export function OnlineIndicator() {
  const { isOnline } = useServiceWorker();

  if (isOnline) return null;

  return (
    <div className="online-indicator" role="status" aria-live="polite">
      <Wifi size={14} />
      <span>已恢复在线</span>
    </div>
  );
}
