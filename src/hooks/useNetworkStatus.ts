import { useEffect, useState, useCallback } from "react";

export function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const checkOnline = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { method: "HEAD", cache: "no-store" });
      if (res.ok) {
        if (!online) setOnline(true);
        return true;
      }
    } catch {
      // network error
    }
    if (online) setOnline(false);
    return false;
  }, [online]);

  return { online, checkOnline };
}
