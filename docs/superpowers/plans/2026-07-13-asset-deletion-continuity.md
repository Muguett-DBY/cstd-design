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
- [ ] Stage named files, scan, commit, push `main`, and match local/remote SHAs.
- [ ] Require exact-SHA CI/Pages success, exact/custom-domain smoke, disposable production delete acceptance, cleanup, and final evidence recording.

## Pre-release evidence (2026-07-13)

- Baseline passed 2 files / 22 tests. The initial RED run then failed four assertions: deleted IDs returned from stale lists, deletion lost to a conflicting committed copy, partial batch success omitted confirmed IDs and cleared failed selection, and single deletion reported ordinary success after a failed refresh.
- A review RED run exposed three additional overlapping-request gaps before the refresh coordinator existed. Final focused GREEN passed 2 files / 28 tests, covering stale lists, deletion precedence, older-response suppression, pending deletion/write overlays, truthful single-delete feedback, and partial batch retry selection.
- Full local gates passed on the final implementation: Node tests 10/10; Vitest 91 files / 582 tests; frontend and Functions TypeScript checks; ESLint with zero warnings; production build and chunk budget; zero high-level audit vulnerabilities; no unreviewed install scripts; dry-run clean install; production secret-name verification; no remote D1 migrations; dependency-tree resolution; 412-commit Gitleaks scan; and diff hygiene.
- Headed Chromium against local Wrangler Pages used two real 68-byte PNG uploads. For the first deletion, `/api/assets` deliberately returned the stale two-item snapshot and the UI still moved from 2 items to 1. For the second deletion, `/api/assets` deliberately returned HTTP 503 and the UI moved to 0 while announcing `素材已删除；列表同步失败，已从当前视图移除。`.
- A fresh browser tab with normal routing confirmed `/api/assets` HTTP 200 with zero assets, both filenames absent, 390 x 844 with no document/body horizontal overflow, and zero console errors or warnings. The mobile empty state was visually inspected. Browser sessions, eight-process Wrangler trees, port 8797, isolated D1/R2 state, temporary logs, and Playwright artifacts were all removed.
