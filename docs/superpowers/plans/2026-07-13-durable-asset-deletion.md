# Durable asset deletion implementation plan

- [x] Add failing tests that reproduce cross-store deletion ordering and partial clear failures.
- [x] Add a migrated D1 cleanup queue with retry metadata and runtime schema parity.
- [x] Commit logical deletion and queue insertion atomically before R2 cleanup.
- [x] Protect shared object keys and retry deferred cleanup from asset-list requests.
- [x] Make scope clearing one D1 transaction and report deferred physical cleanup.
- [x] Validate focused tests, Functions types, lint, migration SQL, shared-key behavior, and retry SQL.
- [x] Run the full repository suite, production build, dependency/security checks, and real local Pages browser acceptance.
- [x] Commit and push the exact scope, then close CI, migration, deployment, and production acceptance.

## Local verification evidence

- RED: the new focused suite failed because no durable deletion module existed; all three scope-clearing assertions also failed against R2-first, multi-call behavior.
- GREEN: 2 focused files / 8 tests passed, followed by Functions typecheck and ESLint with zero warnings.
- Full tests: 10 Node tests plus 93 Vitest files / 590 Vitest tests passed.
- Production build and chunk budget passed. The existing reviewed Mermaid lazy-parser allowance remained the only budget exception.
- `npm audit --audit-level=high` found 0 vulnerabilities; install-script review found none; lockfile dry-run was up to date.
- A fresh isolated local D1 applied migrations `0001` through `0010`. The shared-key probe retained one live reference without queueing, then queued the final deletion and advanced retry metadata successfully.
- Local Pages acceptance used a real 661.8 KB PNG: upload returned 201, deletion returned 200, the subsequent and post-reload asset lists returned 200 with zero assets, and the durable queue contained zero rows.
- The 390 x 844 asset empty state had 390 px document/body widths, no stale filename, and zero browser console errors or warnings; the rendered state was visually inspected.
- Production secret names are configured. Remote D1 correctly reports only `0010_asset_deletion_queue.sql` pending for the release workflow.
- Browser sessions, Playwright artifacts, isolated D1/R2 state, port 8798, and QA processes were removed.

## Release evidence

- Implementation commit: `f56dc2a95b1d01d56cdf294934b06a220daf53ef` (`fix: make asset deletion durable`).
- The first run, `29248153527`, correctly stopped before migration/deploy because CI lint found two unused test-mock parameters. The minimal follow-up commit `d858a51c90d1316f4d36d5bff29d81e17d3f78a0` removed them after local focused tests, full lint, and production build passed.
- Release run `29248366177` / job `86810663892` passed checkout, secret scan, install, all tests, Functions typecheck, lint, build, production binding verification, D1 migration, Pages deployment, and deployment verification.
- Remote D1 reports no pending migrations after applying `0010_asset_deletion_queue.sql`.
- Exact deployment: `c67630b2-1142-4e9c-8a50-88fe0da61055` at `https://c67630b2.cstd-design.pages.dev` for source `d858a51`.
- Exact deployment and `https://design.custard.top` both passed the production shell, anonymous session contract, authenticated boundary, and disabled E2E-session checks for the full release SHA.
- Authenticated production acceptance uploaded the same 661.8 KB PNG (201), listed exactly one QA asset, deleted it through the UI (200), and confirmed an idempotent repeat delete returned `{ ok: true, cleanupDeferred: false }`.
- Remote D1 confirmed the QA asset row, cleanup queue rows, and queued attempts were all zero. A fresh 390 x 844 production page showed zero assets, no stale filename, no horizontal overflow, and zero console errors or warnings; the screenshot was visually inspected.
- Production logout returned 200. The browser session and local Playwright artifacts were removed, and local `HEAD`, `origin/main`, and the remote ref matched the release SHA before this evidence-only update.
