const CACHE_PREFIX = "cstd-design-";
const STATIC_CACHE = `${CACHE_PREFIX}static-v2`;
const STATIC_ASSETS = ["/"];

async function installStaticShell() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(STATIC_ASSETS);
  } catch {
    // Cache Storage is optional. The privacy update must still replace an older worker.
  }
}

async function removeLegacyCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== STATIC_CACHE)
        .map(async (name) => {
          try {
            await caches.delete(name);
          } catch {
            // Logout and future activations can retry cleanup after transient storage failures.
          }
        }),
    );
  } catch {
    // Activating the network-only API policy is safer than leaving the old worker in control.
  }
}

async function skipWaitingSafely() {
  try {
    await self.skipWaiting();
  } catch {
    // A failed lifecycle optimization must not fail installation.
  }
}

async function claimClientsSafely() {
  try {
    await self.clients.claim();
  } catch {
    // Existing pages can still adopt the worker on their next navigation.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([
    installStaticShell(),
    skipWaitingSafely(),
  ]));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    removeLegacyCaches(),
    claimClientsSafely(),
  ]));
});

function offlineApiResponse() {
  return new Response(JSON.stringify({ error: "当前离线，无法读取私人数据。" }), {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return offlineApiResponse();
  }
}

async function cacheResponse(key, response) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(key, response);
  } catch {
    // Offline support is optional; a cache quota or storage failure must not replace live data.
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResponse("/", response.clone());
    }
    return response;
  } catch {
    return (await caches.match("/"))
      || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function cacheFirstStatic(request) {
  let cachedResponse;
  try {
    cachedResponse = await caches.match(request);
  } catch {
    cachedResponse = undefined;
  }
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    if (response.ok && !/\bno-store\b/i.test(response.headers.get("Cache-Control") || "")) {
      await cacheResponse(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    event.waitUntil(removeLegacyCaches());
    event.respondWith(networkOnly(request));
    return;
  }

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstStatic(request));
});
