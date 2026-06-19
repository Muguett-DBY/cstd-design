import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cstd-design:notifications-enabled";

export function useNotifications() {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (permission === "granted" && enabled) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, "false");
      } catch {
        // ignore
      }
    }
  }, [enabled, permission]);

  const request = useCallback(async () => {
    if (typeof Notification === "undefined") {
      return "unsupported" as const;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") setEnabledState(true);
    return result;
  }, []);

  const send = useCallback((title: string, body: string, onClick?: () => void) => {
    if (typeof Notification === "undefined") return;
    if (permission !== "granted" || !enabled) return;
    try {
      const n = new Notification(title, {
        body,
        icon: "/brand/mascot.png",
        badge: "/brand/mascot.png",
      });
      if (onClick) {
        n.onclick = () => {
          window.focus();
          onClick();
          n.close();
        };
      }
    } catch {
      // ignore
    }
  }, [permission, enabled]);

  return { permission, enabled, request, send, setEnabled: setEnabledState };
}
