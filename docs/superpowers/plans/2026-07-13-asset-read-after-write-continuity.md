# Asset Read-after-write Continuity Implementation Plan

> **For agentic workers:** Execute each checkbox as an implementation plus verification step.

**Goal:** Keep successfully written media immediately visible and distinguish post-commit refresh failures from upload failures.

## Constraints

- Work directly on `main`; do not create a branch, force push, or use `git add .`.
- Do not change routes, response schemas, persistence, upload limits, accepted types, or successful UI copy.
- Reuse `AssetItem`, current notices, current state ownership, and existing upload controls.
- Stage named files only and remove all local/production QA artifacts.

### Task 1: Establish regressions

- [x] Add `mergeCommittedAssets` tests for stale lists, fresh matching metadata, order, and deduplication.
- [x] Require `api.assets()` to use `cache: "no-store"`.
- [x] Require `UploadBox` to pass committed assets to its callback and retain truthful success semantics when that callback rejects.
- [x] Run focused tests and verify RED.

### Task 2: Implement read-after-write continuity

- [x] Implement the pure merge helper.
- [x] Merge committed assets before and after the list refresh in `App`.
- [x] Pass committed assets through upload, global drop, image edit, and image generation paths.
- [x] Add client and server no-store semantics for the asset list.
- [x] Separate post-commit refresh failure handling from abortable upload errors.
- [x] Run focused tests and require GREEN.

### Task 3: Review, release, and accept

- [x] Review every asset-producing call site, callback type, stale-list merge, cancellation path, notice, and cache boundary.
- [x] Run full tests, Functions typecheck, lint, build/budget, dependency/install-script audits, secret scans, production binding verification, remote migration check, and diff hygiene.
- [x] In local Pages + headed Chromium, hold the post-upload asset list response, verify committed visibility and truthful status, release refresh, and clean QA data.
- [ ] Stage named files, scan, commit, push `main`, and match local/remote SHAs.
- [ ] Require exact-SHA CI/Pages success, exact/custom-domain smoke, production immediate visibility, final QA deletion, and zero remaining matches.

## Pre-release evidence (2026-07-13)

- RED evidence: the initial focused run failed on the missing merge helper, client no-store option, committed callback payload, and truthful refresh-failure notice. A second RED run exposed four real false-success paths when the application returned `false` instead of rejecting. The final review regression failed because concurrent write reconciliation did not yet exist.
- GREEN evidence: the final focused run passed 5 files / 30 tests, including stale-list ordering, listed metadata, concurrent committed-state preservation, ordinary refresh replacement, callback rejection, callback `false`, same-file retry, global drop, and single/batch image semantics.
- Final local gate passed: the production-smoke harness passed 8/8, Vitest passed 91 files / 576 tests, Functions typecheck passed, ESLint passed with zero warnings, the production build and chunk budget passed, `npm audit --audit-level=high` found zero vulnerabilities, and `npm install-scripts ls` found no unreviewed scripts.
- Release-safety checks passed: required Pages secrets are configured, remote D1 has no pending migrations, Gitleaks scanned 408 commits with no leaks, and diff hygiene reported no whitespace errors.
- Final production-like Pages acceptance passed in headed Chromium: a stale empty `/api/assets` response preserved the uploaded reference and success summary; forced refresh 503s preserved the reference and summary while showing the specific refresh-failure notice; 390 x 844 had no page overflow; the endpoint returned `Cache-Control: private, no-store`; two QA assets were deleted with HTTP 200 and zero remained; after normal reload, session/assets/readiness were all 200 with zero console warnings/errors or page errors; logout returned 200.
