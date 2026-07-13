# Atomic Media Persistence Implementation Plan

> **For agentic workers:** Execute every checkbox as a closed implementation and verification step.

**Goal:** Prevent partial or orphaned media state across R2 and D1 for uploads, image generation, and completed videos.

**Tech Stack:** Cloudflare Pages Functions, R2, D1, TypeScript, Vitest, Wrangler.

## Constraints

- Work directly on `main`; do not create a branch, force push, or use `git add .`.
- Do not add dependencies, routes, migrations, bindings, provider calls, or response fields.
- Keep successful endpoint behavior and client-visible validation unchanged.
- Stage only named files, tie production evidence to the exact pushed SHA, and delete all disposable production assets.

### Task 1: Establish persistence regressions

**Files:**
- Create: `functions/_shared/asset-persistence.test.ts`
- Create: `functions/_shared/asset-persistence.ts`

- [x] Add tests that require one D1 batch for multiple asset rows and an optional related statement.
- [x] Add failure tests requiring cleanup of all attempted R2 keys when a later `put`, the D1 batch, or a returned unsuccessful result fails.
- [x] Require the original persistence error to survive a cleanup failure.
- [x] Run `npm test -- functions/_shared/asset-persistence.test.ts` and verify RED before implementation.

### Task 2: Implement and wire the atomic boundary

**Files:**
- Create: `functions/_shared/asset-persistence.ts`
- Modify: `functions/api/uploads.ts`
- Modify: `functions/api/images.ts`
- Modify: `functions/api/videos/[id].ts`

- [x] Write all attempted R2 objects before one transactional D1 batch and inspect every batch result.
- [x] On failure, best-effort delete every attempted key without masking the original error.
- [x] Make uploads persist every file in one batch.
- [x] Make image generation use the shared boundary.
- [x] Make video asset insertion and task linking one batch.
- [x] Run focused tests and Functions typecheck; require GREEN.

### Task 3: Review and publish

- [x] Review every `MEDIA_BUCKET.put` call and prove all media writes use the shared boundary.
- [x] Run the complete local release gate: full tests, Functions typecheck, lint, build/budget, audit, install-script audit, secret checks, production binding verification, remote migration check, and diff hygiene.
- [x] Stage named files only, scan the staged diff, commit, push `main`, and match local/remote SHAs.
- [x] Require exact-SHA GitHub Actions and Cloudflare Pages success plus exact-deployment and custom-domain smoke.
- [x] In headed Chromium, upload two disposable files in one selection, verify both listed assets and media responses, then delete every exact QA filename, recheck zero, close the browser, and remove artifacts.

## Pre-release evidence (2026-07-13)

- RED: the focused suite first failed because the shared boundary did not exist. A second regression then proved a successful D1 response with zero inserted asset rows was incorrectly accepted.
- GREEN: `functions/_shared/asset-persistence.test.ts` passes seven cases covering multi-object batching, related statement ordering, conditional inserts, thrown and resolved D1 failures, zero-row inserts, failed R2 writes, full attempted-key cleanup, and original-error preservation.
- Independent review expanded video completion to update only an unlinked task and conditionally insert its asset after that link exists in the same batch. A concurrent completion or deletion therefore produces zero asset rows and R2 compensation rather than an orphan or duplicate.
- Static review finds no endpoint-owned `MEDIA_BUCKET.put`; all three media write paths use the shared boundary.
- Full local gates passed: 90 Vitest files / 568 tests plus 8 production-smoke harness tests, Functions typecheck, ESLint, production build and chunk budget, high-severity dependency audit, install-script audit, production-secret verification, remote D1 migration check, 406-commit secret scan, and diff hygiene.
- Local Pages Functions acceptance uploaded two valid PNGs in one request (HTTP 201), verified two listed D1 assets and two readable R2 responses with the expected MIME type and byte count, deleted both assets, confirmed zero remaining QA filenames, logged out the QA session, stopped `workerd`, and released the preview port.

## Release evidence (2026-07-13)

- Implementation commit `86cb6c59ee5321062ad181944d4e979acf160414` was pushed directly to `main`; local `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` matched.
- GitHub Actions run `29235957101` completed successfully in 1m42s. Secret scan, install, all tests, Functions typecheck, lint, build, production-secret verification, D1 migration check, Pages deployment, and deployment verification passed.
- Cloudflare production deployment `a7c9554a-f9c0-4a98-9c5f-65b41a62380f` published source `86cb6c5` at `https://a7c9554a.cstd-design.pages.dev`. Exact-deployment and `https://design.custard.top` smoke both verified the full commit SHA, anonymous and authenticated boundaries, and disabled production E2E bypass.
- Headed Chromium sent one real two-file request and received HTTP 201. The exact deployment exposed two D1 assets and two readable `image/png` R2 responses of 677,702 bytes each; both rendered in Assets on desktop and 390 x 844 mobile, with no horizontal overflow, console warnings/errors, or page errors.
- Production cleanup deleted both exact QA assets, confirmed zero matches across repeated fresh reads, logged out the short-lived QA session with HTTP 200, and removed browser artifacts after screenshot review.
