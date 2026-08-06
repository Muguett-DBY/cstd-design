# Private API cache isolation implementation plan

- [x] Add failing executable Service Worker tests for private API replay, stale document navigation, and activation cleanup scope.
- [x] Add a cache-write failure regression test so live navigation survives unavailable Cache Storage.
- [x] Make private API requests network-only and document navigation network-first with an offline shell fallback.
- [x] Add default `no-store` JSON response headers and preserve explicit overrides.
- [x] Add scoped app-cache cleanup for logout and unauthorized session transitions.
- [x] Replace the misleading offline availability message with the actual private-data requirement.
- [x] Keep the privacy worker installable when Cache Storage lifecycle operations fail.
- [x] Retry legacy-cache cleanup after private API reads to catch late writes from the replaced worker.
- [x] Derive offline readiness from the actual cached root shell instead of Service Worker activation alone.
- [x] Pass focused Service Worker, frontend, API helper, and Functions typecheck gates.
- [x] Pass the full repository test suite, lint, build, dependency, and secret-scan gates.
- [x] Complete local built Pages browser acceptance for cache isolation, offline API behavior, fresh navigation, and logout cleanup.
- [ ] Commit and push the exact scope, then close CI, deployment, and production acceptance.

## Focused verification evidence

- RED: all three initial Service Worker assertions failed against the previous API-cache and cache-first navigation implementation; the cache-write regression then failed because a quota error caused stale-shell fallback.
- RED: the client tests failed because scoped cache cleanup did not exist and the offline status still promised that the cached app could continue working.
- RED: lifecycle failure coverage reproduced that a cache quota error could reject installation, and a simulated late legacy write survived activation cleanup. Shell readiness was also unavailable as a real cache check.
- GREEN: the Service Worker sandbox passes 6/6 behavior tests, including lifecycle failure tolerance and API-triggered cleanup retry.
- GREEN: the API helper, cache-cleanup/readiness hook, and offline indicator pass 27/27 focused tests; Functions typecheck also passes.
- GREEN: the full repository suite passes 16 Node tests and 594 Vitest tests; lint, Functions typecheck, and production build pass, with the reviewed Mermaid parser chunk remaining within its documented budget exception.
- GREEN: dependency checks report 0 high-or-higher audit vulnerabilities, the lockfile dry-run succeeds, install scripts match the explicit allowlist, and full-history plus changed-path Gitleaks scans are clean.
- GREEN: built local Pages browser acceptance confirms authenticated API responses are `no-store` and absent from Cache Storage, offline private API reads return 503/no-store, late legacy caches are removed while unrelated caches survive, the UI reaches the authenticated workspace, 390px has no horizontal overflow, and logout leaves only safe static resources.
