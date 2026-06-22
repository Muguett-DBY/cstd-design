import { useCallback, useEffect, useState } from "react";

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          if (registration.installing) {
            registration.installing.addEventListener("statechange", (event) => {
              if ((event.target as ServiceWorker).state === "activated") {
                setIsOfflineReady(true);
              }
            });
          } else if (registration.active) {
            setIsOfflineReady(true);
          }
        })
        .catch(() => {
          // Service worker registration failed
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const clearCache = useCallback(async () => {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      setIsOfflineReady(false);
    }
  }, []);

  return { isOnline, isOfflineReady, clearCache };
}
