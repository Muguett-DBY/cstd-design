import { useCallback, useEffect, useState } from "react";

const APP_CACHE_PREFIX = "cstd-design-";
const APP_STATIC_CACHE = `${APP_CACHE_PREFIX}static-v2`;

export async function hasCachedAppShell() {
  if (!("caches" in globalThis)) return false;

  try {
    return Boolean(await globalThis.caches.match("/", { cacheName: APP_STATIC_CACHE }));
  } catch {
    return false;
  }
}

export async function clearAppCaches() {
  if (!("caches" in globalThis)) return;

  const cacheNames = await globalThis.caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith(APP_CACHE_PREFIX))
      .map((name) => globalThis.caches.delete(name)),
  );
}

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const refreshOfflineReadiness = () => {
      void hasCachedAppShell().then((ready) => {
        if (mounted) setIsOfflineReady(ready);
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          if (registration.installing) {
            registration.installing.addEventListener("statechange", (event) => {
              if ((event.target as ServiceWorker).state === "activated") {
                refreshOfflineReadiness();
              }
            });
          } else if (registration.active) {
            refreshOfflineReadiness();
          }
        })
        .catch(() => {
          // Service worker registration failed
        });
    }

    return () => {
      mounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const clearCache = useCallback(async () => {
    await clearAppCaches();
    setIsOfflineReady(false);
  }, []);

  return { isOnline, isOfflineReady, clearCache };
}
