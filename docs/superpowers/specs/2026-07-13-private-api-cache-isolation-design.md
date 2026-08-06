# Private API cache isolation design

## Problem

The Service Worker previously cached every successful same-origin `GET /api/*` response and replayed it when the network failed. Authenticated conversations, assets, session state, and readiness data could therefore remain in browser Cache Storage after logout and could be shown later as stale private state. Document navigation was also cache-first, so a returning user could keep receiving an obsolete application shell after a production deployment.

## Decision

Separate the offline shell from private application data:

1. Treat every `/api/*` request as network-only. If the network is unavailable, return an explicit `503` JSON response instead of consulting Cache Storage.
2. Mark JSON API responses `Cache-Control: no-store` by default as a second, server-side cache boundary while preserving deliberate header overrides.
3. Fetch document navigations from the network first and update the single cached root shell only after a successful response. Use that shell solely as an offline UI fallback.
4. Keep cache-first behavior only for same-origin static resources that do not opt out with `no-store`.
5. Version the shell cache and remove every legacy `cstd-design-*` cache during Service Worker activation while preserving unrelated caches on the same origin. Every private API read retries that cleanup in the background so a late write from the replaced worker cannot persist indefinitely.
6. Never let Cache Storage installation, enumeration, deletion, or quota errors block the new network-only privacy worker from installing and claiming clients.
7. Clear only `cstd-design-*` caches after logout or an unauthorized response so legacy private entries are removed immediately without affecting other applications. Subsequent public login-page resources may safely recreate the static-only cache.
8. Describe offline behavior truthfully: report the interface as cached only after verifying that `/` exists in the current shell cache; private data still requires a network connection.

## Failure behavior

- Cache reads, writes, or quota failures never replace a successful live navigation response.
- Cache failures during lifecycle events do not leave the previous API-caching worker in control.
- Offline private API reads return `503`, `Cache-Control: no-store`, and a clear Chinese error message.
- Cache cleanup failure never prevents the application from completing logout or reacting to an unauthorized response.
- A missing cached root keeps the UI out of the offline-ready state even when a Service Worker is active.
- If neither the network nor the cached shell is available, document/static requests return a controlled `503` response.

## Verification contract

- Execute the real Service Worker source in a VM sandbox and assert API isolation, network-first navigation, cache-write failure tolerance, lifecycle failure tolerance, scoped legacy-cache cleanup, and cleanup retry after a late legacy write.
- Unit-test the shared JSON response cache header, scoped client cache cleanup, real shell-readiness detection, and truthful offline status copy.
- In a real browser controlled by the built Service Worker, prove that Cache Storage contains no `/api/` requests, an offline API request returns `503`, online navigation replaces a seeded stale shell, and logout removes app-owned caches.
- Run the full test, typecheck, lint, production build, dependency/security, CI, deployment, and production smoke gates before release closure.
