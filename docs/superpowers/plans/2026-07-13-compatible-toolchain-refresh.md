# Compatible Toolchain Refresh Implementation Plan

> **For agentic workers:** Execute each checkbox as an implementation plus verification step.

**Goal:** Upgrade compatible toolchain dependencies while keeping runtime binaries, install approvals, privacy controls, and production behavior aligned.

## Constraints

- Work directly on `main`; do not create a branch, force push, or use `git add .`.
- Do not include TypeScript 7 in this maintenance cycle.
- Pin the Linux `workerd` binary to Wrangler's exact runtime dependency rather than the newest independently published binary.
- Stage named files only and remove local/production QA artifacts.

### Task 1: Establish the invariant

- [x] Review official release metadata, engine requirements, install scripts, and the latest successful baseline CI.
- [x] Add a runtime-toolchain test that checks Wrangler/workerd manifest and lockfile alignment.
- [x] Add a Pages configuration test for supported telemetry and the unsupported Worker-only dependency-instrumentation setting.
- [x] Run the focused test and verify RED on the newly introduced dependency-instrumentation policy.

### Task 2: Refresh compatible dependencies

- [x] Update Wrangler, its required Workers Types 5 peer, ESLint, and Lucide React.
- [x] Align the Linux `workerd` pin and sole install-script approval with Wrangler's required runtime.
- [x] Confirm dependency instrumentation is Worker-only, keep the Pages configuration valid, and regenerate the lockfile with npm.
- [x] Require the focused invariant test to pass.

### Task 3: Review, release, and accept

- [x] Audit the resolved dependency graph, install scripts, lockfile diff, vulnerabilities, and excluded major upgrades.
- [x] Run full tests, Functions typecheck, lint, build/budget, production binding verification, remote migration check, and secret/diff hygiene.
- [x] Run local Pages plus headed Chromium across authentication and core workspaces with zero actionable console/page errors and no mobile overflow.
- [x] Stage named files, scan, commit, push `main`, and match local/remote SHAs.
- [x] Require exact-SHA CI/Pages success plus exact/custom-domain production smoke, then record release evidence and clean QA artifacts.

## Pre-release evidence (2026-07-13)

- Baseline commit `efcba45b78df35884a665f7a8f9805cbba9407b9` passed GitHub Actions run `29241414103` and both exact/custom-domain production smoke checks before this update.
- Official package metadata confirmed Node 26 compatibility and Wrangler 4.110.0's exact dependency on `workerd 1.20260708.1`.
- `npm install-scripts ls` reported no unreviewed install scripts before the update.
- The new focused test passed the existing 1.20260702.1 alignment and failed only because the project had not yet encoded a policy for Wrangler's newly introduced dependency instrumentation; later Pages validation established that the Worker-only setting must be omitted here.
- The first strict npm install correctly rejected Wrangler 4.110.0 beside Workers Types 4. The update was expanded to the supported Workers Types 5 peer after confirming that this project uses only the retained root ambient entrypoint; no force or legacy-peer resolver bypass was used.
- A full gate caught that Pages rejects the Worker-only `dependencies_instrumentation` configuration. Wrangler 4.110.0 contains `package_dependencies` only in Worker deploy/version upload builders, not its Pages deployment path, so the invalid section was removed while `send_metrics = false` remained enforced.
- The strict resolved tree contains Wrangler 4.110.0, Workers Types 5.20260713.1, Miniflare/workerd 4.20260708.1/1.20260708.1, ESLint 10.7.0, and Lucide React 1.24.0. The lockfile changed only those packages and the five platform-specific workerd binaries.
- The focused invariant passed 2/2, Functions typecheck accepted Workers Types 5, `npm install-scripts ls` found no unreviewed scripts, and `npm audit --audit-level=high` found zero vulnerabilities. Remaining outdated entries are the intentionally deferred TypeScript 7 compiler migration and the independently newer workerd binary that does not match Wrangler's runtime.
- Upgraded local Pages compiled and ran with Wrangler 4.110.0. Headed Chromium authenticated through the local test boundary and rendered consultation, image, video, and asset workspaces; asset list/detail modes worked; 390 x 844 had no horizontal overflow; console errors and warnings were zero; the browser, QA artifacts, five-process server tree, and port 8792 were cleaned.
- Final pre-commit gates passed on the corrected tree: 10/10 Node tests and 91 Vitest files / 576 tests, Functions typecheck, ESLint with zero warnings, production build and chunk budget, required Pages secret verification, remote D1 with no pending migrations, lockfile `npm ci --dry-run`, zero vulnerabilities, no unreviewed install scripts, and Gitleaks across 410 commits.

## Release evidence (2026-07-13)

- Implementation commit `6c5ec722b77ff1e2eb2442a3cb7e1130ce2d2491` was pushed to `main`; local `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` matched exactly.
- GitHub Actions run `29242963201` / deploy job `86793118371` completed successfully in 1 minute 50 seconds. Linux install, the new workerd invariant, all tests, Functions typecheck, lint, build, production binding verification, D1 migration, Pages deploy, and deployment verification passed.
- Cloudflare Pages deployment `601d04e9-bf47-414c-9e09-240555548ac8` published the implementation at `https://601d04e9.cstd-design.pages.dev`. Both that exact deployment and `https://design.custard.top` passed anonymous-session, authentication-boundary, disabled-E2E-bypass, and full-commit-SHA smoke checks.
- Headed Chromium production acceptance on the exact deployment logged in with HTTP 200, visited Chat, Image, Video, and Assets, activated grid/list/detail asset modes, and verified 390 x 844 without horizontal overflow. Actionable console issues and page errors were both zero; logout returned HTTP 200.
- The disposable production script and output directory were removed; no production data fixtures were created by this read-only UI acceptance.
