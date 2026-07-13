# Asset Deletion Continuity Implementation Plan

> **For agentic workers:** Execute each checkbox as an implementation plus verification step.

**Goal:** Keep confirmed asset deletions immediately reflected in the UI through stale or failed list refreshes.

## Constraints

- Work directly on `main`; do not create a branch, force push, or use `git add .`.
- Do not change server routes, persistence order, response schemas, confirmation text, or destructive scopes.
- Preserve all existing write-side continuity behavior and ordinary no-argument refresh replacement.
- Stage named files only and remove every local/production QA artifact.

### Task 1: Establish regressions

- [x] Add state-helper tests proving removed IDs survive stale list responses and deletion wins over conflicting inputs.
- [x] Add overlapping-request tests for older responses, pending deletions, and existing write overlays.
- [x] Add single-delete coverage requiring the confirmed ID and truthful refresh-failure feedback.
- [x] Extend partial batch coverage to require only successful IDs and retain failed selection.
- [x] Run focused tests and verify RED for the missing deletion contract.

### Task 2: Implement deletion continuity

- [x] Extend the callback type without changing existing one-argument callers.
- [x] Apply confirmed removals immediately and during list reconciliation in `App`.
- [x] Serialize response application and retain pending write/delete overlays until the newest outstanding list confirms them.
- [x] Pass confirmed IDs from single and batch deletion flows.
- [x] Preserve failed batch selection and distinguish post-delete refresh failures from delete failures.
- [x] Run focused tests and require GREEN.

### Task 3: Review, release, and accept

- [x] Review callback compatibility, deletion precedence, batch settlement mapping, selection state, notices, and concurrent stale-list behavior.
- [x] Run the full test, Functions typecheck, lint, build/budget, security, dependency, binding, migration, and diff-hygiene gates.
- [x] In local Pages + headed Chromium, force stale/failed post-delete refreshes and verify desktop/mobile state, accessibility, overflow, and console health.
- [x] Stage named files, scan, commit, push `main`, and match local/remote SHAs.
- [x] Require exact-SHA CI/Pages success, exact/custom-domain smoke, disposable production delete acceptance, cleanup, and final evidence recording.

## Pre-release evidence (2026-07-13)

- Baseline passed 2 files / 22 tests. The initial RED run then failed four assertions: deleted IDs returned from stale lists, deletion lost to a conflicting committed copy, partial batch success omitted confirmed IDs and cleared failed selection, and single deletion reported ordinary success after a failed refresh.
- A review RED run exposed three additional overlapping-request gaps before the refresh coordinator existed. Final focused GREEN passed 2 files / 28 tests, covering stale lists, deletion precedence, older-response suppression, pending deletion/write overlays, truthful single-delete feedback, and partial batch retry selection.
- Full local gates passed on the final implementation: Node tests 10/10; Vitest 91 files / 582 tests; frontend and Functions TypeScript checks; ESLint with zero warnings; production build and chunk budget; zero high-level audit vulnerabilities; no unreviewed install scripts; dry-run clean install; production secret-name verification; no remote D1 migrations; dependency-tree resolution; 412-commit Gitleaks scan; and diff hygiene.
- Headed Chromium against local Wrangler Pages used two real 68-byte PNG uploads. For the first deletion, `/api/assets` deliberately returned the stale two-item snapshot and the UI still moved from 2 items to 1. For the second deletion, `/api/assets` deliberately returned HTTP 503 and the UI moved to 0 while announcing `素材已删除；列表同步失败，已从当前视图移除。`.
- A fresh browser tab with normal routing confirmed `/api/assets` HTTP 200 with zero assets, both filenames absent, 390 x 844 with no document/body horizontal overflow, and zero console errors or warnings. The mobile empty state was visually inspected. Browser sessions, eight-process Wrangler trees, port 8797, isolated D1/R2 state, temporary logs, and Playwright artifacts were all removed.

## Release evidence (2026-07-13)

- Implementation commit `35e72b30e49c79861d1de4b41e8a58b39e20e098` (`fix: preserve asset deletion continuity`) was pushed to `main`; `HEAD` and `origin/main` matched after push. The eight named files passed staged diff hygiene and a staged Gitleaks scan of approximately 19.3 KB.
- GitHub Actions run `29245782960` / deploy job `86802224828` completed successfully in 1 minute 39 seconds. Checkout, secret scan, install, tests, Functions typecheck, lint, build, production secret verification, D1 migrations, Pages deployment, and deployment verification all passed.
- Cloudflare Pages deployment `43f8a43c-17c7-4453-b757-59026b8e4c90` published the implementation at `https://43f8a43c.cstd-design.pages.dev`. Both the exact deployment and `https://design.custard.top` passed anonymous-session, authentication-boundary, disabled-E2E-bypass, and full-commit-SHA smoke checks.
- Headed Chromium authenticated on the exact production deployment without exposing the password. Two uniquely named 1 x 1 PNG assets were uploaded through the real production API and deleted through the real confirmation UI. The stale-list handler was exercised once; the first deleted filename remained absent while the other QA asset remained authoritative. The forced HTTP 503 list handler was exercised three times; the second card disappeared and the truthful synchronization warning rendered.
- A fresh 390 x 844 production page confirmed zero matching QA assets, 375 px document/body scroll widths, no horizontal overflow, zero console issues, and zero page errors. The production mobile empty state was visually inspected. Idempotent emergency deletion found zero remaining matches, logout returned HTTP 200, and all Playwright files and processes were removed.
