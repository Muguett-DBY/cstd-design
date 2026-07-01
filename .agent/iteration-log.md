# Iteration Log

## Long Campaign 033 — Stage 6 Command Accessibility IMPROVE (2026-07-01)

### Goal
- Complete the command-palette keyboard and assistive-technology contract with explicit combobox/listbox linkage and safe close/reopen behavior.

### Completed locally
- Promoted command search to an explicit `combobox`.
- Linked the combobox to the command `listbox` through `aria-controls`.
- Added stable option ids and `aria-activedescendant` updates as keyboard selection moves.
- Added query/index reset on close and restored focus to the opener when the palette closes.
- Added `autocomplete="off"` to the command input to avoid browser autofill noise.

### Verified
- RED: `npx vitest run src/components/CommandPalette.test.tsx` failed because command search was still a textbox, lacked active-descendant linkage, and close/reopen did not satisfy the focus/query contract.
- GREEN targeted: same command — 1 file, 8 tests passed.
- Debug correction: the first full lint run rejected synchronous state updates inside the open/close effect; root-cause fix moved query/index reset into the close event handler and kept the effect limited to focus synchronization.
- Full local gate passed after correction: `npm test` — Node smoke 5 tests plus Vitest 83 files, 533 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 392-commit gitleaks scan; `git diff --check`.

### CI status
- Scoped commit, GitHub Actions deployment, exact production smoke, live browser verification, and final campaign closure are pending.

### Next
- Push Stage 6, verify CI and exact production deployment, then record final Campaign 033 closure.

## Long Campaign 033 — Stage 5 Recent History CHECK (2026-07-01)

### Goal
- Audit the new command-palette recent history for persisted-data regressions and fix verified issues.

### Finding fixed
- Duplicate command ids loaded from `cstd-design:commandPaletteRecent:v1` could render duplicate `最近使用` options and trigger React duplicate-key warnings.
- Stale ids from older backups or manual storage edits were also carried through the recent display path instead of being normalized out.

### Completed locally
- Added regression coverage for duplicate and stale recent command ids.
- Normalized recent command ids with stable first-seen ordering, max-length enforcement, duplicate removal, and optional valid-command filtering.
- Applied normalization when reading storage, rendering recent items, and recording a newly executed command.

### Verified
- RED: `npx vitest run src/components/CommandPalette.test.tsx` failed because the second visible option was duplicate `Second` instead of `First`, and React reported duplicate key `second`.
- GREEN targeted: same command — 1 file, 6 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 83 files, 531 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 391-commit gitleaks scan; `git diff --check`.

### CI status
- Commit `581a400 fix: normalize recent command history` was pushed to `main`; GitHub Actions run `28494549985` passed all deployment steps.
- Exact deployment `https://523f2805.cstd-design.pages.dev` passed production smoke for `581a4006e78d4dfffa449e2be7cc9974f2390552`.
- Live desktop/mobile browser QA passed: injected duplicate/stale recent data normalized to `偏好设置` then `前往 图片`, duplicate `action-settings` appeared once, `missing-command` did not render, mobile had no horizontal overflow, and console reported 0 errors and 0 warnings.

### Next
- Continue Stage 6 final IMPROVE by completing the command-palette accessibility/focus contract.

## Long Campaign 033 — Stage 4 Recent Commands IMPROVE (2026-07-01)

### Goal
- Make repeated command work faster by surfacing recently executed commands at the top of the command palette.

### Completed locally
- Added persistent recent-command history under `cstd-design:commandPaletteRecent:v1`.
- Recorded successful click and Enter command execution before closing the palette.
- Added a `最近使用` section when the palette opens without a query.
- Deduplicated the recent command from its normal group while keeping normal search results unchanged.
- Included recent command history in the settings backup key allowlist with a reader-facing label.

### Verified
- RED: `npx vitest run src/components/CommandPalette.test.tsx src/storage-keys.test.ts` failed because executing `Second` left recent command storage empty and the backup key was missing.
- GREEN targeted: same command — 2 files, 11 tests passed.
- Debug correction: the first full gate rejected an indexed group write as possibly undefined and flagged an `onClose` hook dependency; root-cause fix used an explicit local group assignment and added the missing dependency.
- Full local gate passed after correction: `npm test` — Node smoke 5 tests plus Vitest 83 files, 530 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 390-commit gitleaks scan; `git diff --check`.

### CI status
- Commit `c24f6bc feat: remember recent commands` was pushed to `main`; GitHub Actions run `28459973477` passed all deployment steps.
- Exact deployment `https://9c6c92e1.cstd-design.pages.dev` passed production smoke for `c24f6bc5c5d9986292ab92102eff4fa6c5d7738c`.
- Live desktop/mobile browser QA passed: executing `settings` wrote `["action-settings"]`, reloading and reopening showed `最近使用` first, `偏好设置` appeared once, mobile had no horizontal overflow, and final console checks reported 0 errors and 0 warnings.

### Next
- Continue Stage 5 CHECK by auditing the new recent-command history for malformed or duplicate persisted data.

## Long Campaign 033 — Stage 3 Command Feedback UIUX (2026-07-01)

### Goal
- Make command search easier to trust by showing the result count and current keyboard position before execution.

### Completed locally
- Added a compact command-palette summary row below search.
- Displayed total filtered commands, e.g. `共 2 个命令`.
- Displayed the active keyboard position, e.g. `当前 1/2`, and updated it as Arrow navigation changes.
- Added mobile-safe summary styling with tabular numeric position feedback.

### Verified
- RED: `npx vitest run src/components/CommandPalette.test.tsx` failed because `共 2 个命令` and current-position feedback did not exist.
- GREEN targeted: `npx vitest run src/components/CommandPalette.test.tsx` — 1 file, 4 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 83 files, 528 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 389-commit gitleaks scan; `git diff --check`.

### CI status
- Commit `c8afc5e uiux: clarify command search position` was pushed to `main`; GitHub Actions run `28458567769` passed all deployment steps.
- Exact deployment `https://ec60e0db.cstd-design.pages.dev` passed production smoke for `c8afc5e0cbc29f50ba960fb0f6048ef65823c51b`.
- Live browser QA passed on desktop and mobile: summary text rendered, ArrowDown updated current position, `settings` filtered to `共 1 个命令 / 当前 1/1`, Enter opened Settings, mobile had no horizontal overflow, and console reported 0 errors and 0 warnings.

### Next
- Continue Stage 4 IMPROVE with a stronger action-oriented command-palette increment after Stage 3 release verification closes.

## Long Campaign 033 — Stage 2 Keyboard Selection IMPROVE (2026-07-01)

### Goal
- Keep Enter execution aligned with the visible result after a query replaces or shrinks the command list.

### Completed locally
- Reset selection synchronously whenever the search query changes or the palette opens.
- Derived a safe active index for dynamic item changes without effect-driven state updates.
- Kept Arrow navigation within bounds for empty and non-empty results and scrolled the active option into view.

### Verified
- RED: after selecting the third command and narrowing to one different result, Enter called the sole visible command 0 times.
- GREEN targeted: `npx vitest run src/components/CommandPalette.test.tsx` — 1 file, 3 tests passed.
- Debug gate: the first full lint run rejected effect-driven index clamping; root-cause correction moved clamping to derived render state and targeted tests plus lint passed.
- Full local gate passed after correction: `npm test` — Node smoke 5 tests plus Vitest 83 files, 527 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 388-commit gitleaks scan; `git diff --check`.

### CI status
- Commit `ca3f4dd fix: stabilize command keyboard selection` was pushed to `main`; GitHub Actions run `28457003723` passed all deployment steps.
- Exact deployment `https://7bc9e1ba.cstd-design.pages.dev` passed production smoke for `ca3f4dd51171e89ddab31cbade5c02b1de12eac6`.
- Live authenticated browser QA passed: Ctrl+K opened the palette, ArrowDown twice selected the third command, searching `settings` reset the visible result to `偏好设置`, Enter opened Settings, and console reported 0 errors and 0 warnings.

### Next
- Continue Stage 3 UIUX with visible result-count and keyboard-position feedback.

## Long Campaign 033 — Stage 1 Command Discovery IMPROVE (2026-07-01)

### Goal
- Make every declared command alias and visible description usable for command discovery instead of requiring a label match first.

### Completed locally
- Added the first dedicated `CommandPalette` component regression suite.
- Changed ranking so label, description, and keyword aliases match independently.
- Kept label matches weighted above equivalent description and alias matches, and normalized surrounding query whitespace.

### Verified
- RED: `npx vitest run src/components/CommandPalette.test.tsx` failed both alias-only and description-only searches because the option disappeared.
- GREEN targeted: `npx vitest run src/components/CommandPalette.test.tsx` — 1 file, 2 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 83 files, 526 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 387-commit gitleaks scan; `git diff --check`.

### CI status
- Commit `172102f fix: search command aliases` was pushed to `main`; GitHub Actions run `28456268069` passed all deployment steps.
- Exact deployment `https://e194cebc.cstd-design.pages.dev` passed production smoke for `172102f9ce93319138acb401064fa11c29475627`.
- Live authenticated browser QA passed: Ctrl+K + `settings` returned only `偏好设置`; Enter opened Settings; console reported 0 errors and 0 warnings.

### Next
- Continue Stage 2 IMPROVE by keeping keyboard selection valid when a query narrows or replaces the result set.

## Risk Preflight — Build Budget and Workspace Hygiene (2026-07-01)

### Goal
- Clear known release risks before starting the next long 6-stage orchestrator loop.

### Completed locally
- Converted Vite 8 build chunking from the deprecated-style `rollupOptions.output.manualChunks` hook to `build.rolldownOptions.output.codeSplitting` groups for React, markdown, KaTeX, diagram layout, and diagram rendering dependencies.
- Added `scripts/verify-build-budget.mjs` and wired it into `npm run build`.
- Kept initial static JavaScript at a 600 KiB budget while documenting and enforcing a reviewed 700 KiB allowance for Mermaid's lazy-loaded parser core chunk.
- Added `.gitignore` coverage for local agent/browser artifacts: `.agent/orchestrator-history/` and `.playwright-cli/`.

### Verified
- RED reproduced: `npm run build` emitted Vite's large chunk warning for `chunk-KEIR6QF5-DNzq6p3w.js` at 662.65 kB.
- Sourcemap analysis confirmed the oversized file is a single third-party `@mermaid-js/parser` core module loaded from the Mermaid markdown rendering path, not an initial application bundle.
- GREEN: `npm run build` passed with no Vite large chunk warning and the new budget verifier passed: 1 initial JS chunk <= 600 KiB, lazy JS chunks <= 600 KiB except the reviewed Mermaid parser allowance.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 82 files, 524 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 385-commit gitleaks scan; `git diff --check`.

### Next
- Start Campaign 033 from the long 6-stage orchestrator contract after this risk preflight is pushed, CI-verified, and exact-deployment smoke-verified.

## Long Campaign 032 — Stage 6 Readiness Refresh Feedback IMPROVE (2026-06-30)

### Goal
- Confirm whether a Service Readiness refresh actually resolved or introduced blockers.

### Completed locally
- Compared the previous and latest normalized readiness snapshots after refresh.
- Added `刚刚恢复：...` feedback for checks that move from attention to ready.
- Added `新增待处理：...` and unchanged-refresh copy for other refresh outcomes.
- Added compact success-card styling for the refresh result.

### Verified
- RED: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` failed because refresh recovery feedback did not exist.
- GREEN targeted: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` — 1 file, 10 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 82 files, 524 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 383-commit gitleaks scan; `git diff --check`.
- Browser QA passed at desktop 1440×900 and mobile 390×844 with authenticated API stubs: attention loaded, refresh changed to ready, `刚刚恢复：生成服务、素材存储` rendered, progress reached 100%, no horizontal overflow, and zero console/page errors.

### CI status
- Commit `40774b4 feat: summarize readiness refresh changes` was pushed to `main`; GitHub Actions run `28440956586` passed all deployment steps.
- Exact deployment `https://3278c2f7.cstd-design.pages.dev` passed production smoke for commit `40774b47ba998d7ece68ed03f2b3b7668fd8a0c6`.

### Next
- Campaign 032 is complete; no further Service Readiness blocker remains from this campaign.

## Long Campaign 032 — Stage 5 Readiness Response Guard CHECK (2026-06-30)

### Goal
- Prevent malformed or forward-incompatible Service Readiness responses from crashing Settings.

### Finding fixed
- Unknown check ids from `/api/readiness` reached the action-plan renderer, where `check.action.title` was read from `undefined`.

### Completed locally
- Added runtime normalization before storing Service Readiness snapshots.
- Rejects invalid snapshot status, non-array checks, unknown check ids, invalid check statuses, and missing text fields.
- Routes invalid responses into the existing `暂时无法检查` alert with `服务状态响应格式异常。`.

### Verified
- RED: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` failed with a React render crash for an unknown readiness check id.
- GREEN targeted: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` — 1 file, 9 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 82 files, 523 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 382-commit gitleaks scan; `git diff --check`.
- Browser QA passed at desktop 1440×900 and mobile 390×844 with an invalid readiness response: safe alert rendered, normal attention summary did not render, no horizontal overflow, and zero console/page errors.

### CI status
- Commit `11a8feb fix: validate service readiness snapshots` was pushed to `main`; GitHub Actions run `28440421150` passed all deployment steps.
- Exact deployment `https://36c3f3f3.cstd-design.pages.dev` passed production smoke for commit `11a8feb4be5f106a989d5b32d29fb5885ace1f82`.

### Next
- Continue Stage 6 final IMPROVE with one final Service Readiness recovery feedback increment, then close the campaign.

## Long Campaign 032 — Stage 4 Pending Readiness Summary IMPROVE (2026-06-30)

### Goal
- Make degraded Service Readiness results easy to hand off as an action-only recovery summary.

### Completed locally
- Added `复制待处理摘要` only when readiness has attention checks.
- Copied the recommended action order and workspace availability impact.
- Excluded ready-check diagnostic noise such as `数据服务: ready` from the action handoff.

### Verified
- RED: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` failed because `复制待处理摘要` did not exist.
- GREEN targeted: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` — 1 file, 8 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 82 files, 522 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 381-commit gitleaks scan; `git diff --check`.
- Browser QA passed at desktop 1440×900 and mobile 390×844 with authenticated API stubs: pending summary copied the expected action order and workspace impact, excluded ready-check noise, had no horizontal overflow, and had zero console/page errors.

### CI status
- Commit `474e8b7 feat: copy pending readiness summary` was pushed to `main`; GitHub Actions run `28439700768` passed all deployment steps.
- Exact deployment `https://d7c287ed.cstd-design.pages.dev` passed production smoke for commit `474e8b752498effaac18246a2b7e8da7ff6c75de`.

### Next
- Continue Stage 5 CHECK by auditing Service Readiness failure/response edge cases and fixing any verified issue with regression coverage first.

## Long Campaign 032 — Stage 3 Readiness Progress UIUX (2026-06-30)

### Goal
- Make Service Readiness status easier to scan by showing completion progress before detailed checks.

### Completed locally
- Added a compact readiness overview above the action area.
- Exposed ready/total count, pending count, and an accessible `服务就绪进度` progressbar.
- Added warning/success visual treatment and mobile single-column wrapping.

### Verified
- RED: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` failed because readiness progress summary text and progressbar did not exist.
- GREEN targeted: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` — 1 file, 7 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 82 files, 521 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 380-commit gitleaks scan; `git diff --check`.
- Production-preview browser QA passed at desktop 1440×900 and mobile 390×844 with 50% progress, no overflow, no console errors, no page errors, and no failed requests.

### CI status
- Commit `d9035b4 uiux: clarify service readiness progress` was pushed to `main`; GitHub Actions run `28438597365` passed all deployment steps.
- Exact deployment `https://3cd5a1a0.cstd-design.pages.dev` passed production smoke for commit `d9035b4165c91548633f98248d9b205a0b471206`.

### Next
- Continue Stage 4 IMPROVE with an actionable recovery follow-up for the Service Readiness attention state.

## Long Campaign 032 — Stage 2 Readiness Impact Map IMPROVE (2026-06-30)

### Goal
- Explain which workspaces remain available when only part of the service stack is degraded.

### Completed locally
- Added an accessible three-state `工作区可用性` map for consultation, image/video, and asset workflows.
- Distinguished foundational security/data blockers from generation outages and storage-only limitations.
- Added responsive cards that collapse to a single column on mobile.

### Verified
- RED: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` failed because the named availability list did not exist.
- GREEN targeted: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` — 1 file, 6 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 82 files, 520 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; 379-commit gitleaks scan; `git diff --check`.
- Production-preview browser QA passed at desktop 1440×900 and mobile 390×844 with correct blocked/limited labels and no overflow, console errors, page errors, or failed requests.

### CI status
- Commit `5afb7fa feat: map service readiness impact` was pushed to `main`; GitHub Actions run `28437676500` passed all deployment steps.
- Exact deployment `https://fe149471.cstd-design.pages.dev` passed production smoke for commit `5afb7fab7427d8533312a319b678eccf38100075`.

### Next
- Continue Stage 3 UIUX by strengthening the summary hierarchy with a compact readiness score and progress treatment.

## Long Campaign 032 — Stage 1 Service Readiness Actions IMPROVE (2026-06-30)

### Goal
- Turn degraded Service Readiness results into a prioritized recovery path before users start creation.

### Completed locally
- Added an accessible `建议处理顺序` checklist for attention checks.
- Prioritized security and data-path blockers ahead of generation and storage follow-up.
- Added concise impact copy for every suggested action and responsive mobile styling.

### Verified
- RED: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` failed because `服务就绪建议处理顺序` was missing.
- GREEN targeted: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` — 1 file, 5 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 82 files, 519 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Production-preview browser QA passed at desktop 1440×900 and mobile 390×844 with no overflow, console errors, page errors, or failed requests.

### CI status
- Commit `403e1b5 feat: guide service readiness remediation` was pushed to `main`; GitHub Actions run `28437131543` passed all deployment steps.
- Exact deployment `https://a83828e9.cstd-design.pages.dev` passed production smoke for commit `403e1b5af9b3ff663059e88be0def476d15ec098`.

### Next
- Continue Stage 2 IMPROVE with a visible readiness impact map that clarifies which creation workflows remain available under partial degradation.

## Long Campaign 031 — Stage 6 Saved Search Removal IMPROVE (2026-06-30)

### Goal
- Complete the saved Global Search lifecycle by allowing obsolete or accidental saved queries to be removed from the empty search state.

### Completed locally
- Added an accessible delete action beside every saved Global Search chip.
- Kept query application and deletion as separate controls so deleting never applies the query first.
- Added joined-chip styling with destructive hover feedback and responsive wrapping.
- Added regression coverage for UI removal and persisted localStorage cleanup.

### Verified
- RED: `npx vitest run src/components/GlobalSearchModal.test.tsx` failed because `删除已保存搜索：launch` was missing.
- GREEN targeted: `npx vitest run src/components/GlobalSearchModal.test.tsx` — 1 file, 5 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 73 files, 491 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Authenticated local Pages browser QA passed at `http://127.0.0.1:8819` on desktop 1440×900 and mobile 390×844: saved query exposed distinct apply/delete controls, deletion persisted `[]`, the mobile dialog had equal 375px client and scroll widths, and the console had 0 errors/0 warnings.

### CI status
- Commit `346dfff feat: manage saved global searches` was pushed to `main`; GitHub Actions run `28419346834` passed all deployment steps.
- Exact deployment `https://47cb4688.cstd-design.pages.dev` passed production smoke for commit `346dfff2e8ac2b671882a98ab6ade50d163d8a82`.

### Next
- Campaign 031 is complete at 6/6 stages. Start the next campaign from a newly verified workflow need; no known Global Search blocker remains from this campaign.

## Long Campaign 031 — Stage 5 Saved Search Storage CHECK (2026-06-30)

### Goal
- Audit the saved Global Search path for stability issues and fix a verified storage edge case with regression coverage.

### Finding fixed
- Invalid JSON shapes in `cstd-design:saved-searches` could make `useSavedSearches` return a non-array object.
- Global Search expects an array of saved searches, so corrupted localStorage could crash the modal when it tried to call array methods.

### Completed locally
- Added a regression test for invalid persisted saved-search data.
- Changed saved-search loading to ignore non-array parsed values.
- Added per-entry validation for id, name, query, role filter, date filter, and finite creation timestamp.

### Verified
- RED: `npx vitest run src/hooks/useSavedSearches.test.ts` failed before invalid persisted data was ignored.
- GREEN targeted: `npx vitest run src/hooks/useSavedSearches.test.ts src/components/GlobalSearchModal.test.tsx` — 2 files, 10 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 73 files, 490 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI status
- Commit `c7f7833 fix: validate saved search storage` was pushed to `main`; GitHub Actions run `28418675582` passed all deployment steps.
- Exact deployment `https://e203882a.cstd-design.pages.dev` passed production smoke for commit `c7f78334ca46f22adc44fc041d98160d8c0ef297`.

### Next
- Continue Stage 6 final IMPROVE with one final user-facing Global Search increment and final release closure.

## Long Campaign 031 — Stage 4 Global Search Saved Queries IMPROVE (2026-06-30)

### Goal
- Let users turn a useful Global Search query into a reusable saved search and reapply it without retyping.

### Completed locally
- Added `保存本次搜索` for non-empty global queries.
- Reused the existing saved-search persistence hook and storage key.
- Added empty-state saved-search chips for the latest saved queries.
- Reapplying a saved search restores the query and resets result selection.
- Added compact styling for the save action and saved-search chips.

### Verified
- RED: `npx vitest run src/components/GlobalSearchModal.test.tsx` failed because the save/reapply controls were missing.
- GREEN targeted: `npx vitest run src/components/GlobalSearchModal.test.tsx` — 1 file, 4 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 73 files, 489 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local production preview browser QA passed at `http://127.0.0.1:8818` on desktop 1440×900 and mobile 390×844: save action persisted `launch`, empty-state saved chip restored the query, horizontal overflow, console errors, and page errors checked.
- Commit `bbb6379 feat: save global search queries` was pushed to `main`; GitHub Actions run `28418240441` passed all deployment steps.
- Exact deployment `https://e05557d0.cstd-design.pages.dev` passed production smoke for commit `bbb6379ea51c59141db727dc74a76541014594d2`.

### Next
- Continue Stage 5 CHECK by auditing Global Search edge cases and fixing any verified stability issue with failing coverage first.

## Long Campaign 031 — Stage 3 Global Search Feedback UIUX (2026-06-30)

### Goal
- Improve Global Search clarity and keyboard confidence after message, tag, and collection results became actionable.

### Completed locally
- Added a result status row under the search input.
- Added result count and current keyboard-selection position.
- Added visible shortcut chips for `↑↓ 选择`, `Enter 打开`, and `Esc 关闭`.
- Added `aria-current` and a left accent marker to the active result.
- Guarded arrow-key handling when no results exist.

### Verified
- RED: `npx vitest run src/components/GlobalSearchModal.test.tsx` failed because the new result count, current position, shortcut hints, and active-result ARIA feedback were missing.
- GREEN targeted: `npx vitest run src/components/GlobalSearchModal.test.tsx` — 1 file, 3 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 73 files, 488 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local production preview browser QA passed at `http://127.0.0.1:8818` on desktop 1440×900 and mobile 390×844: status row, shortcut hints, keyboard selection movement, active-result marker, horizontal overflow, console errors, and page errors checked.
- Commit `a9b5f7d uiux: clarify global search feedback` was pushed to `main`; GitHub Actions run `28410366920` passed all deployment steps.
- Exact deployment `https://b3b02a3e.cstd-design.pages.dev` passed production smoke for commit `a9b5f7d8cc24dee04624b86fd5154723429fe54a`.

### Next
- Continue Stage 4 IMPROVE with a stronger action-oriented Global Search increment using the clarified result feedback.

## Long Campaign 031 — Stage 2 Global Search Asset Filters IMPROVE (2026-06-30)

### Goal
- Make Global Search tag and collection results open the Asset Workspace with the matching filter already applied.

### Completed locally
- Fixed Global Search tag discovery so it searches tag names and reports tag frequencies.
- Added collection selection callbacks to Global Search.
- Added App-level asset filter request state for tag and collection search results.
- Added Asset Workspace filter target initialization for tag and collection requests.
- Used request-keyed remounting for Asset Workspace targets so the feature stays compatible with the React hook lint rules.

### Verified
- RED: `npx vitest run src/components/GlobalSearchModal.test.tsx src/components/AssetWorkspace.test.tsx` failed because collection results did not route, tag search did not find tag names, and Asset Workspace ignored external filter targets.
- GREEN targeted: `npx vitest run src/components/GlobalSearchModal.test.tsx src/components/AssetWorkspace.test.tsx` — 2 files, 7 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 73 files, 487 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Commit `455d9dc feat: route global search asset filters` was pushed to `main`; GitHub Actions run `28409497305` passed all deployment steps.
- Exact deployment `https://926ad811.cstd-design.pages.dev` passed production smoke for commit `455d9dc960d2ed7502233f405960454a6fbe636e`.

### Next
- Continue Stage 3 UIUX by improving Global Search clarity and keyboard/visual feedback now that more result types are actionable.

## Long Campaign 031 — Stage 1 Global Search Message Targeting IMPROVE (2026-06-30)

### Goal
- Make Global Search message results trustworthy by routing active-conversation message matches to the exact selected message.

### Completed locally
- Added `GlobalSearchModal` coverage for selecting an active-conversation message result.
- Added `useMessageSearch` coverage for focusing a result by exact message id.
- Passed the active conversation id and exact message callback through Global Search.
- Added App-level message target state and handed it to `ChatWorkspace`.
- Opened the in-conversation message search UI, restored the searched query, focused the matching message result, and reused the existing scroll/highlight behavior.
- Fixed the new effect dependencies so lint remains clean.

### Verified
- RED: `npx vitest run src/components/GlobalSearchModal.test.tsx src/hooks/useMessageSearch.test.ts` failed before exact routing and focus support were implemented.
- GREEN targeted: `npx vitest run src/components/GlobalSearchModal.test.tsx src/hooks/useMessageSearch.test.ts` — 2 files, 2 tests passed.
- Full local gate passed after implementation and lint fix: `npm test` — Node smoke 5 tests plus Vitest 73 files, 484 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Commit `e669004 feat: target global search message results` was pushed to `main`; GitHub Actions run `28408764767` passed all deployment steps.
- Exact deployment `https://7d7e6ea1.cstd-design.pages.dev` passed production smoke for commit `e6690046bb9608abc0ae03aec6fa7a96709ea3ca`.

### Next
- Continue Stage 2 IMPROVE by making another inert Global Search result type actionable.

## Long Campaign 030 — Stage 6 Empty Activity Start Actions IMPROVE (2026-06-30)

### Goal
- Finish the Creation Center activity loop by turning an empty recent-activity state into a direct creation starting point.

### Completed
- Replaced the passive empty activity message with an accessible `活动为空时开始创作` panel.
- Added direct empty-state actions for consulting, image, and video creation when `onStartWorkspace` is available.
- Styled the empty panel and made the action layout wrap on desktop and stack on mobile.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed because the empty activity action region did not exist.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 26 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 482 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local preview browser QA passed on desktop 1440×900 and mobile 390×844: empty activity panel visible, image start action closed Creation Center and activated the image workspace, no horizontal overflow, no console warnings/errors, and preview port 8817 was cleaned up.
- Commit `fd78933 feat: add empty activity start actions` was pushed to `main`; GitHub Actions run `28407592403` passed all deployment steps.
- Exact deployment `https://f6e1366c.cstd-design.pages.dev` passed production smoke for commit `fd78933d5384d77b4755e85ca03b3046a203facd`.

### Next
- Campaign 030 is complete at 6/6 stages; continue the next campaign from the now actionable Creation Center activity loop.

## Long Campaign 030 — Stage 5 Activity Timestamp CHECK (2026-06-30)

### Goal
- Audit Creation Center activity persistence for damaged timestamp data before it reaches the recent-activity UI.

### Completed
- Found that persisted creation activity accepted any string `createdAt`, including invalid dates.
- Added a regression test that seeds one valid activity and one invalid-timestamp activity.
- Hardened activity validation and ordering so invalid timestamps are filtered before exposure and persistence.

### Verified
- RED: `npx vitest run src/hooks/useCreationActivity.test.ts` failed because the invalid activity was still loaded.
- GREEN: `npx vitest run src/hooks/useCreationActivity.test.ts` — 3 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 481 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI status
- Commit `e43a947` passed GitHub Actions run `28406281601`.
- Exact deployment `https://1ba9740f.cstd-design.pages.dev` passed production smoke for commit `e43a94753b5d73651d29de4c63421552e152af68`.

### Next
- Continue Stage 6 final IMPROVE with one user-facing completion increment, then run final full verification and release closure.

## Long Campaign 030 — Stage 4 Priority Action IMPROVE (2026-06-30)

### Goal
- Turn the new Creation Center priority status from a passive cue into an actionable shortcut.

### Completed
- Added a contextual priority action button to the `创作中心优先状态` card.
- The action jumps to the saved-for-too-long queue when stale recovery work exists.
- The same action routes to pending work, recent activity, or continue-work states when those are the highest priority.
- Adjusted desktop and mobile layout so the new action remains aligned and tappable.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed because the priority action button did not exist.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 25 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 480 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI status
- Commit `4d8db33` passed GitHub Actions run `28394104810`.
- Exact deployment `https://e4f0d600.cstd-design.pages.dev` passed production smoke for commit `4d8db33d2af2197b12dda42dd0c6c56cf54adfc9`.

### Next
- Stage 5 CHECK should audit recent activity/recovery edge cases and fix a real stability issue with a failing test first.

## Long Campaign 030 — Stage 3 Creation Center Priority UIUX (2026-06-30)

### Goal
- Make the Creation Center panel communicate the next priority immediately when it opens, especially after activity and recovery summaries grew denser.

### Completed
- Added a `创作中心优先状态` card directly under the overview metrics.
- The card adapts to stale backlog, active pending work, recent activity, or idle states.
- Added warning/success visual treatment and mobile one-column behavior so the card remains readable on narrow screens.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed because `创作中心优先状态` did not exist.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 24 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 479 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local production preview browser QA passed on desktop 1440×900 and mobile 390×844 with stubbed authenticated API data: priority status, risk summary, activity outcome summary, horizontal overflow, console errors, and page errors checked.

### CI
- Commit `6be0c60 uiux: surface creation center priority` pushed to `main`.
- GitHub Actions run `28393344663` passed all steps.
- Exact deployment `https://9c86109b.cstd-design.pages.dev` passed production smoke for commit `6be0c604451a6cdd5ab077ec47411f8b67a17826`.

### Next
- Stage 4 IMPROVE should add an action-level improvement around the new priority status rather than more visual-only polish.

## Long Campaign 030 — Stage 2 Activity Outcome Summary IMPROVE (2026-06-30)

### Goal
- Turn recent Creation Center activity into a more actionable review surface instead of only showing a chronological list.

### Completed
- Added a `创作活动结果摘要` status row for completed, restored, and ignored outcomes.
- Styled the outcome row as compact scannable chips below the latest-activity summary.
- Kept the list newest-first from Stage 1 while adding outcome distribution.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed because `创作活动结果摘要` did not exist.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 23 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 478 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI
- Commit `a96701e feat: summarize creation activity outcomes` pushed to `main`.
- GitHub Actions run `28391887567` passed all steps.
- Exact deployment `https://f7e8b75a.cstd-design.pages.dev` passed production smoke for commit `a96701e5c52773c9aabc95d3593a53bbc3567d24`.

### Next
- Stage 3 UIUX should make the Creation Center panel feel clearer and more mature around the activity/recovery overview.

## Long Campaign 030 — Stage 1 Activity Ordering IMPROVE (2026-06-30)

### Goal
- Continue the Creation Center maturity line by making recent creation activity reliable when activity props arrive out of order.

### Completed
- Added component-level ordering for recent creation activity by actual timestamp.
- The activity summary now reports the real latest activity instead of assuming the first prop item is newest.
- The visible activity list now renders newest-first even when callers pass unsorted data.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed with the summary showing the older activity as latest.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 22 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 477 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI
- Commit `5b03a38 feat: order creation activity by time` pushed to `main`.
- GitHub Actions run `28391364834` passed all steps.
- Exact deployment `https://aef063ca.cstd-design.pages.dev` passed production smoke for commit `5b03a381f1e0b31a41539c63b978357ac895df3c`.

### Next
- Stage 2 IMPROVE should turn recent activity into a more actionable review surface, not just a chronological log.

## Long Campaign 029 — Stage 6 Activity Summary Completion Increment (2026-06-30)

### Goal
- Add a final user-facing Creation Center completion increment so recent outcomes are easier to scan.

### Completed
- Added a `创作活动摘要` live status to the recent activity panel.
- The summary reports total recent activity count and the latest activity label.
- Added compact dashed-card styling for the summary.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before the activity summary existed.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 21 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 476 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local Pages browser QA passed on desktop 1440×900 and mobile 390×844 with browser-stubbed authenticated empty API responses: activity summary count/latest text, clear-activity button, overflow, console, and runtime checks passed.

### CI
- Commit `c613564 feat: summarize recent creation activity` pushed to `main`.
- GitHub Actions run `28388581506` passed all steps.
- Exact deployment `https://5e02a230.cstd-design.pages.dev` passed production smoke for commit `c61356417e7315883b141cc690a0f798b0cad447`.

### Final closure
- All six Long Campaign 029 stages are implemented, locally tested, browser-verified where applicable, pushed to `main`, CI-verified, and exact-deployment smoke-verified.

## Long Campaign 029 — Stage 5 Activity Clear Handler CHECK (2026-06-30)

### Goal
- Audit the recovery-center changes for real regressions and close an actionable component-level issue.

### Finding fixed
- `RecoveryCenter` exposed `清空创作活动` whenever activities existed even though `onClearActivity` is optional.
- In contexts that render activity history without a clear handler, the button was enabled but inert.

### Completed
- Added regression coverage for activity history without `onClearActivity`.
- Hid the clear-activity action unless a clear handler is present.
- Preserved App-level behavior where the clear handler is supplied.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed because the clear-activity button was still visible without a handler.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 21 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 476 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local Pages browser QA passed on desktop 1440×900 and mobile 390×844 with browser-stubbed authenticated empty API responses: App-level clear-activity button remained available, overflow, console, and runtime checks passed.

### CI
- Commit `9099e6e fix: hide inactive activity clear action` pushed to `main`.
- GitHub Actions run `28387875984` passed all steps.
- Exact deployment `https://388ca258.cstd-design.pages.dev` passed production smoke for commit `9099e6eadc42cf3a9a5fb4c957b5d649e63e6226`.

### Next
- Stage 6 final IMPROVE should add one final user-facing completion increment, then run the final full verification and release closure.

## Long Campaign 029 — Stage 4 Workspace Queue Stale Priority (2026-06-29)

### Goal
- Make workspace-specific recovery queues handle saved-for-too-long work without forcing users to scan fresh and stale records together.

### Completed
- Workspace-specific recovery filters now sort saved-for-too-long records before fresh records.
- Added a `当前队列优先提示` callout for filtered workspace queues that contain saved-for-too-long records.
- The callout explains that old saved records are already front-loaded and links to the global saved-for-too-long queue.
- Added responsive styling for the new callout.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before the queue-priority prompt existed.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 20 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 475 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local Pages browser QA passed on desktop 1440×900 and mobile 390×844 with browser-stubbed authenticated empty API responses: queue-priority prompt, stale-first order, saved-for-too-long jump, overflow, console, and runtime checks passed.

### CI
- Commit `eb19544 feat: prioritize stale workspace recoveries` pushed to `main`.
- GitHub Actions run `28370347935` passed all steps.
- Exact deployment `https://cf8ab860.cstd-design.pages.dev` passed production smoke for commit `eb19544921004f369531a0ec70db012216d7f9f7`.

### Next
- Stage 5 CHECK should audit the latest recovery queue behavior for real regressions and close any issue with a failing test first.

## Long Campaign 029 — Stage 3 Creation Center Flow Guide UIUX (2026-06-29)

### Goal
- Make the Creation Center task panel easier to scan by showing priority, current queue, and next action together.

### Completed
- Added a `待处理流程提示` guide with priority, current queue, and next action.
- The guide updates when switching from all work to stale-only work.
- Added responsive styling: three columns on desktop, single-column on mobile.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before the flow guide existed.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 19 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 474 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local Pages browser QA passed on desktop 1440×900 and mobile 390×844.

### CI
- Commit `7150dfa uiux: add recovery flow guide` pushed to `main`.
- GitHub Actions run `28369487237` passed all steps.
- Exact deployment `https://4975bd3c.cstd-design.pages.dev` passed production smoke for commit `7150dfa91ad5a3e3520de23e4cf96d1c1c65b801`.

### Next
- Stage 4 should add a product increment around workspace-specific recovery handling now that the task panel is easier to read.

## Long Campaign 029 — Stage 2 Stale Cleanup Completion Feedback (2026-06-29)

### Goal
- Make the post-cleanup recovery queue self-explanatory after users bulk-ignore old stale records.

### Completed
- Added a `恢复清理结果` live status after bulk stale cleanup.
- Automatically returned the task filter to `全部` after clearing stale records.
- Kept remaining fresh recovery records visible for the next action.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before completion feedback and filter reset existed.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 18 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 473 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local Pages browser QA passed on desktop 1440×900 and mobile 390×844.

### CI
- Commit `dd40a1d feat: confirm stale recovery cleanup` pushed to `main`.
- GitHub Actions run `28367075348` passed all steps.
- Exact deployment `https://13253a6e.cstd-design.pages.dev` passed production smoke for commit `dd40a1ddcb174b3925d7e04f0dfa4c13e6d13d9f`.

### Next
- Stage 3 UIUX should improve the visual hierarchy of the Creation Center task flow now that stale cleanup has a complete interaction loop.

## Long Campaign 029 — Stage 1 Stale Recovery Bulk Cleanup (2026-06-29)

### Goal
- Continue the Creation Center stale-recovery path by making old backlog cleanup discoverable from the priority panel.

### Completed
- Added `忽略全部较久` to `保存较久优先处理`.
- The action dismisses only stale records in oldest-first order and preserves fresh recovery records.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before the priority-panel bulk action existed.
- GREEN: `npx vitest run src/components/RecoveryCenter.test.tsx` — 17 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files, 472 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Local Pages browser QA passed on desktop 1440×900 and mobile 390×844.

### CI
- Commit `1e34523 feat: add stale recovery bulk cleanup` pushed to `main`.
- GitHub Actions run `28366524968` passed all steps.
- Exact deployment `https://9aecc268.cstd-design.pages.dev` passed production smoke for commit `1e345230e346f9471d64a6423fa001f8b466e4d1`.

### Next
- Stage 2 should make recovery backlog progress easier to understand after cleanup, especially when several workspace types remain.

## Long Campaign 026 — Stage 5 Recovery Storage Safety CHECK (2026-06-28)

### Goal
- Audit Creation Center recovery changes for storage, safety, dependency, and release risks.

### Findings
- High-severity dependency audit returned 0 vulnerabilities.
- Secret-like scan hits were expected workflow env names, tests, scripts, and local E2E references.
- Backup coverage already includes recovery backup and recovery activity keys.
- Real issue found: recovery persistence did not catch localStorage write failures.

### Completed
- Added regression coverage for localStorage write failures in `useCreationRecovery`.
- Wrapped recovery persistence in try/catch so storage quota/private-mode failures do not break in-memory recovery records.

### Verified
- RED: `npm test -- src/hooks/useCreationRecovery.test.ts` failed with `Error: quota exceeded`.
- GREEN: `npm test -- src/hooks/useCreationRecovery.test.ts` — 1 file, 4 tests passed.
- Full local gate passed: `npm test` — 67 files, 451 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`.

### Next
- Finish Stage 6 with a final Creation Center usability increment and final live verification.

## Long Campaign 026 — Stage 4 Filtered Recovery Cleanup (2026-06-28)

### Goal
- Make recovery cleanup safer by avoiding an all-or-nothing clear action when users are focused on one task type.

### Completed
- Added `清空{类型}恢复记录` when a specific pending-work filter is active.
- The filtered clear action dismisses only visible records in that type.
- Kept the existing full clear action available only from the `全部` filter.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the filtered clear action existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 11 tests passed.
- Full local gate passed: `npm test` — 67 files, 450 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.

### Next
- Run Stage 5 CHECK against Creation Center storage/recovery safety and backup/release coverage.

## Long Campaign 026 — Stage 3 Creation Center Filter Feedback UIUX (2026-06-28)

### Goal
- Make Creation Center filter changes easier to understand, especially on mobile where visible context is limited.

### Completed
- Added a live `待处理筛选摘要` status line below pending-work filters.
- The summary states whether the list is showing all pending work or a single workspace type.
- Styled the summary as a compact feedback strip.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the filter summary existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 10 tests passed.
- Full local gate passed: `npm test` — 67 files, 449 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Mobile Pages browser verification passed at 390×844 with seeded recovery records, filter summary, no horizontal overflow, and no console warnings/errors.

### Next
- Continue Stage 4 with a durable Creation Center product increment, then run the CHECK stage against storage and release risks.

## Long Campaign 026 — Stage 2 Creation Center Pending Filters (2026-06-28)

### Goal
- Make mixed Creation Center pending work easier to triage without scanning every recovery card.

### Completed
- Added `全部 / 咨询 / 图片 / 视频` pending-work filters.
- Included active video generation in the video filter count.
- Filtered active tasks, recoverable records, and recent video results consistently.
- Added an empty filtered state for categories with no pending work.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the filter group existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 9 tests passed.
- Full local gate passed: `npm test` — 67 files, 448 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.

### Next
- Continue Stage 3 UI/UX with a more polished and clearer Creation Center panel layout around the priority action and filters.

## Long Campaign 026 — Stage 1 Creation Center Priority Action (2026-06-28)

### Goal
- Start a new creation-continuity campaign after Campaign 025 and make Creation Center immediately tell users what to handle first.

### Completed
- Added a `建议先处理` recommendation card to Creation Center.
- Prioritizes active video generation before recoverable failed/draft creation records.
- Added a one-click recommendation action that opens the active task or selected recovery record and closes the panel.
- Added responsive card styling so the action remains readable on mobile.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the recommendation region existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 8 tests passed.
- Full local gate passed: `npm test` — 67 files, 447 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.

### Next
- Continue Stage 2 with better task triage inside Creation Center, especially filtering or grouping mixed recovery work.

## Campaign 016 — Reliable creation loop (in progress, 2026-06-26)

- Added recoverable chat sending: failed content is restored instead of lost, and users can explicitly retry.
- Added recoverable image batches: partial failures retain successful results and retry only failed slots.
- Unified pending/success/error presentation across chat, image, and video with mobile-stacked 44px recovery actions and live-region announcements.
- Added focused state and component tests; current baseline is 381 passing tests.
- Validation: functions typecheck, zero-warning lint, and production build pass.
- Next: recoverable image batches, unified status UX, durable video recipes, health audit, recovery center.

## Campaign 001 — 3-Cycle, 18-Phase Campaign (2026-06-19)

**Theme**: Cross-device data consistency, upload flow maturity, and thread forwarding

### Phase 1/18 — IMPROVE: Thread reply forwarding + forwarded message indicator
- **Commit**: `3e70e61` | **CI**: Passed
- Extended `ForwardRecord` type, added forwarding to thread replies, added "已转发" badge

### Phase 2/18 — IMPROVE: Upload flow progress, error recovery, success confirmation
- **Commit**: `2edf0f6` | **CI**: Passed
- Replaced fetch with XHR for progress tracking, added file validation, cancel, and success summary

### Phase 3/18 — UIUX: Upload area and asset workspace visual polish
- **Commit**: `6c099e8` | **CI**: Passed
- Polished upload box states, asset card metadata, empty states, dark mode support

### Phase 4/18 — IMPROVE: Move bookmarks and pins to D1-backed persistence
- **Commit**: `dcb1dcb` | **CI**: Passed
- Added D1 schema, server endpoints, client hooks for bookmarks and pins

### Phase 5/18 — CHECK: Full project health check
- **Commit**: `3ab248e` | **CI**: Passed
- Fixed race condition with UNIQUE constraints, added UUID validation, improved error codes

### Phase 6/18 — IMPROVE: Conversation export improvements
- **Commit**: `f878443` | **CI**: Passed
- Added plain text export format with Clipboard icon

### Phase 7/18 — IMPROVE: Move reactions and edits to D1-backed persistence
- **Commit**: `43d2add` | **CI**: Passed
- Added D1 schema, server endpoints, client hooks for reactions and edits

### Phase 8/18 — IMPROVE: Keyboard shortcut help panel improvements
- **Commit**: `a5ec7b7` | **CI**: Passed
- Added category headers, search/filter input, improved visual hierarchy

### Phase 9/18 — UIUX: Mobile experience audit and improvements
- **Commit**: `7f5a4fd` | **CI**: Passed
- Improved mobile touch targets, modal sizes, message action buttons

### Phase 10/18 — IMPROVE: Conversation archive improvements
- **Commit**: `72c10db` | **CI**: Passed
- Added archive count badge to filter chip

### Phase 11/18 — CHECK: Security and edge case audit
- **Commit**: `49c29c7` | **CI**: Passed
- Added rate limiting to all new write endpoints

### Phase 12/18 — IMPROVE: Performance and code splitting
- **Commit**: `ab6d82d` | **CI**: Passed
- Lazy-loaded workspace components, ExportModal, Lightbox. Bundle reduced from 607KB to 569KB

### Phase 13/18 — IMPROVE: Conversation merge improvements
- **Commit**: `9d1c556` | **CI**: Passed
- Added merge confirmation dialog, merge history display

### Phase 14/18 — IMPROVE: Message search improvements
- **Commit**: `2530e46` | **CI**: Passed
- Added search history dropdown with recent search recall

### Phase 15/18 — UIUX: Empty states and loading states polish
- **Commit**: `c63348f` | **CI**: Passed
- Added SkeletonLoader component, ChatEmptyState, icon prop for EmptyState

### Phase 16/18 — IMPROVE: Thread management improvements
- **Commit**: `f243520` | **CI**: Passed
- Added search to ThreadCenter with filtering

### Phase 17/18 — CHECK: Final health check and cleanup
- **Commit**: `f842a83` | **CI**: Passed
- Full health check passed: 27 tests, TypeScript clean, ESLint 0 warnings

### Phase 18/18 — IMPROVE: Campaign wrap-up and final polish
- **Status**: COMPLETED
- **Commit**: Campaign state updated

### Campaign 001 Summary
- **18 phases completed** across 3 cycles
- **15 IMPROVE phases**: Thread forwarding, upload progress, D1 persistence (bookmarks, pins, reactions, edits), export formats, keyboard shortcuts, archive improvements, performance/code splitting, merge improvements, search history, thread search
- **3 UIUX phases**: Upload/asset polish, mobile improvements, empty states/skeletons
- **3 CHECK phases**: Health check, security audit, final health check
- **Key achievements**:
  - Migrated bookmarks, pins, reactions, edits from localStorage to D1
  - Added upload progress tracking with cancel support
  - Added plain text export format
  - Improved mobile touch targets
  - Added search history and thread search
  - Reduced bundle size from 607KB to 569KB
  - Added rate limiting to all new endpoints
  - Fixed race conditions with UNIQUE constraints

## Round 43 (latest)

**Type**: 产品功能升级

**Flagship**: Conversation picker modal for message forwarding

### Completed
- Created `ConversationPickerModal` component with searchable conversation list, keyboard-friendly selection, and loading states
- Upgraded `useMessageForwarding` hook from localStorage-only logging to real API-based forwarding via `streamChat`
- Replaced native `prompt()` dialog with polished modal UI for selecting target conversations
- Added forwarding history panel with conversation name and content preview
- Added CSS for picker modal (search, list items, icons, hover states, animations)
- Fixed duplicate import lint error and useEffect setState lint warning

### Verified
- ✅ 27 unit tests pass
- ✅ TypeScript clean, zero-warning ESLint, production build pass
- ✅ GitHub Actions CI passed (run `27812236529`)

### Risks
- Forwarding triggers an AI response in the target conversation (by design, as the message is sent via `streamChat`)
- No undo for forwarding — the forwarding log is append-only in localStorage

### Next Direction
1. Add undo capability for message forwarding
2. Add message forwarding to thread replies (currently only works on main messages)
3. Create a "Forwarded from" indicator in the target conversation

**Recommended next flagship**: Add thread reply forwarding and a forwarded-message indicator.

## Round 42

**Type**: UI/UX 体验升级

**Flagship**: Authenticated workspace shell and chat experience polish

### Completed
- Reworked the core app shell palette, spacing, radii, shadows, and panel hierarchy for a calmer product feel
- Upgraded the chat workspace title/action row, message cards, right-side conversation panel, composer, and loading/empty visual states
- Improved mobile layout rhythm, bottom navigation sizing, message width, composer spacing, and touch-target consistency
- Added semantic workspace navigation with `aria-current` state and a focused `TopBar` regression test
- Normalized primary/ghost button states so disabled, hover, focus, and wrapped toolbar states remain readable

### Verified
- ✅ 26 unit tests pass, including the new `TopBar` navigation accessibility test
- ✅ Functions typecheck, zero-warning ESLint, and production build pass
- ✅ Rendered QA passed on desktop 1440×920, image workspace interaction, and mobile 390×844 with stubbed authenticated data
- ✅ Console health checked during rendered QA with no warnings or errors
- ✅ GitHub Actions `Deploy Cloudflare Pages` passed (run `27764831940`), including remote D1 migration and deployment

### Risks
- The broader app still has some dense localStorage-backed message-action surfaces that deserve a future workflow pass
- Visual identity remains mascot-led; stronger brand assets would allow a larger leap in perceived maturity

### Next Direction
1. Replace prompt-based message forwarding with a real conversation picker flow
2. Continue reducing localStorage-only message action state for cross-device consistency
3. Audit image/video upload flows for richer progress, error recovery, and success confirmation states

**Recommended next flagship**: Upgrade the message forwarding and saved-action workflow from local-only utilities into a polished cross-conversation interaction.

## Round 41

**Previous direction**: Message threading improvements

**Flagship**: Durable D1-backed Thread Center

### Completed
- Replaced browser-local anonymous thread strings with authenticated D1 records tied to conversations and parent messages
- Added add/edit/delete/clear APIs, input validation, stable IDs/timestamps, indexes, and chat-deletion cleanup
- Added a desktop and mobile Thread Center with reply counts, latest activity, parent previews, and jump-to-message behavior
- Extracted focused `MessageThread` and `ThreadCenter` components from the chat workspace
- Added stale-response protection, mutation loading/error states, and search support for structured replies

### Verified
- ✅ 25 unit tests pass, including validation, grouping, and stale request coverage
- ✅ Functions typecheck, zero-warning ESLint, and production build pass
- ✅ Local Pages + D1 QA passed at 1440×900 and 390×844
- ✅ Create, reload persistence, Thread Center jump, edit, delete, empty state, and console health verified
- ✅ GitHub Actions `Deploy Cloudflare Pages` passed (run `27761178761`), including remote D1 migration and deployment

### Risks
- Older localStorage thread notes are not migrated because they had no conversation-safe ownership metadata
- Other message actions (pin/bookmark/edit/forward) still use browser-local state

### Next Direction
1. Replace the prompt-based forwarding placeholder with a real conversation picker and actual target-conversation insertion
2. Persist pin/bookmark/edit metadata server-side for cross-device consistency
3. Add per-thread unread/activity indicators if thread volume grows

**Recommended next flagship**: Complete a real message-forwarding workflow and migrate the remaining high-value message actions off localStorage.

## Round 40

**Flagship**: Conversation search improvements with date range filter

### Completed
- Added date range filter to conversation search UI
- Added date range state management
- Updated filterByDate function to handle date range filter
- Updated conversation list rendering to use date range filter
- Added CSS for date range inputs and separators
- Added Calendar icon to filter panel

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message threading improvements** — Add more threading features
2. **Conversation archiving** — Archive old conversations without deleting
3. **Bulk archive** — Archive multiple conversations at once

## Round 39 (7d274c8)

**Type**: UI/UX 体验升级

### Completed
- 优化消息操作按钮样式（更紧凑、统一间距、圆角）
- 改进按钮 hover/active/pinned 状态视觉反馈
- 消息操作按钮使用更小的字体和间距，减少视觉拥挤
- 添加 white-space: nowrap 防止按钮文字换行

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Conversation search improvements** — Add date range filter and message count filter
2. **Message threading improvements** — Add more threading features
3. **Conversation archiving** — Archive old conversations without deleting

## Round 38 (4ba1d61)

**Type**: Health check and stability improvements

### Issues Found and Fixed
1. **Message forwarding uses `prompt()` for target conversation** - Added comment noting this is a temporary solution
2. **ExportModal preview XSS vulnerability** - Added sanitization to remove script tags and event handlers from preview HTML
3. **ExportModal preview security** - Added proper HTML escaping in preview to prevent XSS attacks

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Health Check Results
- Build and dependencies: ✅ No issues
- GitHub Actions / CI: ✅ No issues
- TypeScript / lint / build: ✅ No issues
- Functional flows: ✅ No critical issues
- UI/UX and responsive: ✅ No critical issues
- Performance and loading: ✅ No critical issues
- Security and data risks: ✅ Fixed XSS vulnerability in export preview
- Code quality and maintainability: ✅ No critical issues

### Next Direction
1. **Conversation search improvements** — Add date range filter and message count filter
2. **Message threading improvements** — Add more threading features
3. **Conversation archiving** — Archive old conversations without deleting

## Round 37 (e2754f8)

**Flagship**: Message forwarding with forwarding history

### Completed
- Created `useMessageForwarding` hook with localStorage persistence
- Added forward button to message actions UI
- Added forwarding history tracking in localStorage
- Added "Forwarded Messages" section in right panel
- Added CSS for forwarding UI and forwarding target
- Forwarding state persists across sessions via localStorage

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Conversation search improvements** — Add date range filter and message count filter
2. **Message threading improvements** — Add more threading features
3. **Conversation archiving** — Archive old conversations without deleting

## Round 36 (24e2657)

**Flagship**: Message bookmarking with quick access panel

### Completed
- Created `useMessageBookmarking` hook with localStorage persistence
- Added bookmark button to message actions UI
- Added "Bookmarked Messages" section in right panel
- Added CSS for bookmark UI and bookmark button
- Bookmark state persists across sessions via localStorage

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message forwarding** — Forward messages to other conversations
2. **Conversation search improvements** — Add date range filter and message count filter
3. **Message threading improvements** — Add more threading features

## Round 35 (cc703ec)

**Flagship**: Conversation merging with merge history

### Completed
- Created `useConversationMerging` hook with localStorage persistence
- Added merge dropdown to conversation card actions
- Added merge history tracking in localStorage
- Added CSS for merge UI and merge tags
- Merge state persists across sessions via localStorage

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message bookmarking** — Bookmark important messages for quick access
2. **Message forwarding** — Forward messages to other conversations
3. **Conversation search improvements** — Add date range filter and message count filter

## Round 34 (e00a2d0)

**Flagship**: Message editing with edit history

### Completed
- Created `useMessageEditing` hook with localStorage persistence
- Added edit button to message actions UI
- Added edit input textarea with save/cancel buttons
- Added "已编辑" indicator on edited messages
- Added CSS for edit input, edit actions, and edited indicator
- Edit history is preserved in localStorage
- Edited content is displayed in messages

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Conversation merging** — Merge two conversations into one
2. **Message bookmarking** — Bookmark important messages for quick access
3. **Message forwarding** — Forward messages to other conversations

## Round 33 (1ba49ce)

**Flagship**: Keyboard shortcuts with help panel

### Completed
- Created `useKeyboardShortcuts` hook for managing keyboard shortcuts
- Added keyboard shortcut help panel in Sidebar
- Added shortcut hints for common actions (Ctrl+K, Ctrl+N, Ctrl+F, Enter, Shift+Enter, Esc)
- Added CSS for keyboard shortcuts panel, shortcut items, and keyboard hint keys
- Keyboard shortcuts help panel is toggleable

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message editing** — Allow users to edit sent messages
2. **Conversation merging** — Merge two conversations into one
3. **Message bookmarking** — Bookmark important messages for quick access

## Round 32 (fd50bd5)

**Flagship**: Export preview with conversation statistics

### Completed
- Added export preview panel in ExportModal
- Added preview toggle button to show/hide preview
- Added preview rendering for Markdown and HTML formats
- Added CSS for preview panel, preview content, and preview header
- Added conversation statistics panel showing message count, thread count, and pinned count
- Export now supports previewing content before downloading

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Keyboard shortcuts** — Add more keyboard shortcuts for common actions
2. **Message editing** — Allow users to edit sent messages
3. **Conversation merging** — Merge two conversations into one

## Round 31 (53db7c8)

**Flagship**: Bulk archive with select mode

### Completed
- Added bulk select mode to sidebar with toggle button
- Added "Select All" checkbox for quick selection
- Added bulk archive/unarchive button
- Updated `useConversationArchiving` hook with `bulkArchive` and `bulkUnarchive` functions
- Added CSS for bulk select UI, bulk actions bar, and selected state
- Bulk mode hides individual actions and shows checkboxes instead

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Export preview** — Preview exported content before downloading
2. **Conversation statistics** — Show message count, thread count, etc.
3. **Keyboard shortcuts** — Add more keyboard shortcuts for common actions

## Round 30 (ef403b4)

**Flagship**: Message search within threads

### Completed
- Extended `useMessageSearch` hook to handle threads
- Updated `MessageSearchBar` to show thread results indicator
- Integrated thread search into ChatWorkspace
- Added "Clear Thread" button to quickly remove all replies
- Added CSS for thread indicator and clear thread button
- Search now includes both main messages and thread replies

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Bulk archive** — Archive multiple conversations at once
2. **Export preview** — Preview exported content before downloading
3. **Conversation statistics** — Show message count, thread count, etc.

## Round 29 (d71265c)

**Flagship**: Export improvements with date range and message selection

### Completed
- Added date range selection UI with start/end date inputs
- Added message selection UI with checkboxes
- Added "Select All" checkbox for quick message selection
- Added collapsible date range and message selection panels
- Updated export logic to handle filtered messages
- Added CSS for date range inputs, message selection list, and toggle buttons
- Export now supports filtering by date range and selected messages

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message search within threads** — Search through threaded replies
2. **Bulk archive** — Archive multiple conversations at once
3. **Export preview** — Preview exported content before downloading

## Round 28 (804fdce)

**Flagship**: Conversation archiving with filter

### Completed
- Created `useConversationArchiving` hook with localStorage persistence
- Added archive/unarchive button to conversation card
- Added "Archived" filter option in sidebar folder bar
- Added archived state visual indicator (dimmed opacity)
- Added "已归档" tag on archived conversations
- Added CSS for archived state, archived tag, and archive button
- Archive state persists across sessions via localStorage

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Export improvements** — Add more export options (date range, selected messages)
2. **Message search within threads** — Search through threaded replies
3. **Bulk archive** — Archive multiple conversations at once

## Round 27 (7de81d9)

**Type**: Health check and stability improvements

### Issues Found and Fixed
1. **ExportModal PDF export popup blocker handling** - Added fallback to download HTML if popup is blocked
2. **UploadBox file input reset on drag-and-drop** - Fixed file input not resetting after drag-and-drop upload

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Health Check Results
- Build and dependencies: ✅ No issues
- GitHub Actions / CI: ✅ No issues
- TypeScript / lint / build: ✅ No issues
- Functional flows: ✅ No critical issues
- UI/UX and responsive: ✅ No critical issues
- Performance and loading: ✅ No critical issues
- Security and data risks: ✅ No issues (no console.log, debugger, sensitive data)
- Code quality and maintainability: ✅ No critical issues

### Next Direction
1. **Conversation archiving** — Archive old conversations without deleting
2. **Export improvements** — Add more export options (date range, selected messages)
3. **Message search within threads** — Search through threaded replies

## Round 26 (3be2d58)

**Flagship**: Message threading with collapsible replies

### Completed
- Created `useMessageThreading` hook with localStorage persistence
- Added reply button to message actions UI
- Added thread indicator showing reply count
- Added collapsible thread replies with expand/collapse toggle
- Added reply input with cancel/send buttons
- Added CSS for thread indicator, thread replies, reply input, and active state
- Thread state persists across sessions via localStorage

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Conversation archiving** — Archive old conversations without deleting
2. **Export improvements** — Add more export options (date range, selected messages)
3. **Message search within threads** — Search through threaded replies

## Round 25 (c28c9f2)

**Flagship**: Export improvements with multiple formats

### Completed
- Created `ExportModal` component with format selection UI
- Added HTML export functionality with styled output
- Added PDF export via browser print dialog
- Added format selection (Markdown, HTML, PDF) with visual preview
- Added print-friendly HTML template for PDF export
- Replaced inline export with modal-based export flow
- Added CSS for export modal, format options, and animations

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message threading** — Allow replies to specific messages
2. **Conversation archiving** — Archive old conversations without deleting
3. **Export improvements** — Add more export options (date range, selected messages)

## Round 24 (91985d1)

**Flagship**: Conversation folders with color coding

### Completed
- Created `useConversationFolders` hook with localStorage persistence
- Added folder creation/management UI in sidebar
- Added folder bar with folder chips for quick filtering
- Added folder selection dropdown on each conversation card
- Added folder color coding (6 colors: amber, green, blue, purple, pink, red)
- Added folder delete functionality
- Added folder tag display on conversation cards
- Added CSS for folder bar, folder chips, folder input, folder select, and folder delete

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Export improvements** — Add more export formats (PDF, HTML)
2. **Message threading** — Allow replies to specific messages
3. **Conversation archiving** — Archive old conversations without deleting

## Round 23 (4992569)

**Flagship**: Message pinning with quick access panel

### Completed
- Created `useMessagePinning` hook with localStorage persistence
- Added pin/unpin button to message actions UI
- Added "Pinned Messages" section in right panel
  - Shows list of pinned messages with snippets
  - Click to scroll to pinned message
  - Visual indicator for pinned state
- Added CSS for pin button, pinned section, and pinned items
- Pin state persists across sessions via localStorage

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Conversation folders** — Organize conversations into folders
2. **Export improvements** — Add more export formats (PDF, HTML)
3. **Message threading** — Allow replies to specific messages

## Round 22 (3c11a48)

**Flagship**: Conversation search improvements with filters

### Completed
- Added date range filter (today, this week, this month, all time)
- Added message count filter (1-10, 11-50, 51-100, 100+)
- Added filter toggle button in search box
- Added filter panel with collapsible UI
- Added message preview snippets in conversation cards
- Added messageCount and lastMessage to ConversationSummary type
- Created ConversationCard component for better code organization
- Added CSS for filter panel, filter options, and conversation snippets

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message pinning** — Allow users to pin important messages
2. **Conversation folders** — Organize conversations into folders
3. **Export improvements** — Add more export formats (PDF, HTML)

## Round 21 (16f9d1f)

**Flagship**: Message reactions with emoji picker

### Completed
- Created `useMessageReactions` hook with localStorage persistence
- Created `ReactionPicker` component with quick emoji selection
- Integrated reactions into ChatWorkspace:
  - Added reaction badges below each message
  - Added hover-to-reveal emoji picker
  - Support for 6 quick emojis: 👍, ❤️, 😊, 🎉, 🤔, 👀
  - Toggle reactions on/off by clicking
  - Visual feedback for active reactions
- Added keyboard shortcut hints in Sidebar (Ctrl+K, Ctrl+N, Ctrl+F)
- Added CSS for reaction picker, badges, and keyboard hints

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Conversation search improvements** — Add date range filter and message count filter
2. **Message pinning** — Allow users to pin important messages
3. **Conversation folders** — Organize conversations into folders

## Round 20 (003114e)

**Flagship**: Build size optimization - lazy load Mermaid chunk

### Completed
- Extracted `MermaidBlock` component into separate file for better code splitting
- Updated `Markdown` component to use `React.lazy` for MermaidBlock
- Added `Suspense` wrapper with fallback for lazy-loaded MermaidBlock
- MermaidBlock component now only loads when mermaid code blocks are encountered
- Added "Copy All" button to ChatWorkspace for quick conversation sharing
- Added `copyAllAsText` function that copies conversation as plain text

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Message reactions** — Add emoji reactions to messages for quick feedback
2. **Conversation search improvements** — Add date range filter and message count filter
3. **Keyboard shortcuts** — Add more keyboard shortcuts for common actions

## Round 19 (01ebe36)

**Flagship**: Drag-and-drop reorder for conversations

### Completed
- Created `useConversationOrder` hook with drag-and-drop logic and localStorage persistence
- Updated `Sidebar` component with drag-and-drop support:
  - Added `GripVertical` icon as drag handle
  - Added `draggable` attribute to conversation cards
  - Added `onDragStart`, `onDragOver`, `onDragLeave`, `onDrop` handlers
  - Added visual feedback (drag-over state with dashed outline and background color)
- Added CSS for drag handle, drag-over state, and cursor states
- Added bulk download for assets:
  - Added `downloadSelected` function in `AssetWorkspace`
  - Added download button in batch actions UI
  - Downloads all selected assets as individual files

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Message reactions** — Add emoji reactions to messages for quick feedback
3. **Conversation search improvements** — Add date range filter and message count filter

## Round 18 (7a8df3b)

**Flagship**: Message search within conversation

### Completed
- Created `useMessageSearch` hook with search logic, result navigation, and active index tracking
- Created `MessageSearchBar` component with search input, result count, and navigation buttons
- Updated `Markdown` component to support `highlightQuery` prop for search result highlighting
- Integrated search into `ChatWorkspace` with:
  - Search button in toolbar
  - Ctrl+F keyboard shortcut to open search
  - Auto-scroll to active search result
  - Result count display (e.g., "3/15")
  - Enter/Shift+Enter to navigate results
  - Escape to close search
- Added CSS for search bar, result count, navigation buttons, and search highlighting
- Added visual pulse animation for active search result

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Drag-and-drop reorder** — Allow users to manually pin or reorder conversations
3. **Message reactions** — Add emoji reactions to messages for quick feedback

## Round 17 (508d3d9)

**Flagship**: Conversation sort/filter

### Completed
- Added `sortConversations` utility with 3 modes: `updatedAt`, `createdAt`, `title` (Chinese locale sorting)
- Sort bar UI below search box with chevron indicators (active state highlighted)
- Conversation count badge in panel heading (accent-colored pill)
- CSS for `.sort-bar`, `.sort-option`, `.conversation-count`
- Sort mode persisted locally in sidebar state

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Message search within conversation** — Search through chat history
3. **Drag-and-drop reorder** — Allow users to manually pin or reorder conversations

## Round 16 (1128213)

**Flagship**: Image generation prompt templates

### Completed
- Created `usePromptTemplates` hook with localStorage persistence (CRUD for templates)
- Template picker UI in ImageWorkspace (save/load/delete)
- Save button appears when prompt is non-empty
- Load button toggles template list
- Delete with inline button per template
- Template list with scrollable container
- Empty state message for no templates

### Verified
- ✅ TypeScript compiles cleanly
- ✅ ESLint passes with 0 warnings
- ✅ All 22 unit tests pass
- ✅ Production build succeeds

### Next Direction
1. **Build size optimization** — Mermaid chunk (593KB) could be lazy-loaded more aggressively
2. **Conversation sort/filter** — Allow users to sort conversations by date/title
3. **Message search within conversation** — Search through chat history

---

## Campaign 002 — 3-Cycle, 18-Phase Campaign (2026-06-19)

**Theme**: Quality of life, search, accessibility, and template-driven workflows

### Phase 1/18 — IMPROVE: Video task elapsed time tracking
- **Commit**: `e558cbf` | **CI**: Passed
- Added `Timer` icon and live elapsed time display in VideoWorkspace task card
- Tracks seconds since video task started using `setInterval` with proper cleanup

### Phase 2/18 — IMPROVE: Lightbox Home/End keys + focus trap + aria-live counter
- **Commit**: `5e712bc` | **CI**: Passed
- Added keyboard shortcuts Home/End to jump to first/last image
- Implemented Tab focus trap to keep focus within lightbox
- Added `aria-live="polite"` to counter for screen reader announcements

### Phase 3/18 — IMPROVE: Unified `ResultCard` component
- **Commit**: `af15834` | **CI**: Passed
- Extracted shared result card for image/video results in chat
- Eliminates duplication, ensures consistent UI

### Phase 4/18 — IMPROVE: Asset metadata extraction
- **Commit**: `7207437` | **CI**: Passed
- Created `useAssetMetadata` hook for image dimensions and video duration
- Client-side extraction via Image/Video elements + Promise

### Phase 5/18 — IMPROVE: Accessibility fixes
- **Commit**: `fca4c90` | **CI**: Passed
- Added dialog role, Escape handlers, body scroll lock
- Improved color contrast

### Phase 6/18 — UIUX: Onboarding tour
- **Commit**: `c7ae7cb` | **CI**: Passed
- 5-step OnboardingTour with localStorage persistence
- Walks new users through chat, image, video, asset, sidebar

### Phase 7/18 — IMPROVE: Video task persistence
- **Commit**: `1412ad7` | **CI**: Passed
- `useVideoTaskPersistence` hook for video task state across tab switches
- Started timestamp auto-added in `setTask`

### Phase 8/18 — IMPROVE: Regenerate as style reference
- **Commit**: `c30d380` | **CI**: Passed
- Regenerate button uses last result as image style reference
- Streamlined image iteration workflow

### Phase 9/18 — IMPROVE: Toggle button accessibility
- **Commit**: `d978efe` | **CI**: Passed
- Added `aria-pressed`, `role=radio`, `aria-checked` to Segmented, folder chips, sort/filter, style chips

### Phase 10/18 — TEST: Add 22 more unit tests
- **Commit**: `9e28706` | **CI**: Passed
- 12 asset-metadata tests, 6 useVideoTaskPersistence tests, 4 Segmented tests
- Total: 49 tests across 9 test files

### Phase 11/18 — CHECK: Performance audit
- **Commit**: `6318898` | **CI**: Passed
- Verified all setInterval calls have proper cleanup
- No memory leaks detected

### Phase 12/18 — IMPROVE: Network resilience
- **Commit**: `acceebd` | **CI**: Passed
- Added automatic retry with exponential backoff (800ms, 1600ms)
- Retries on network failures, 5xx, 408, 429
- 401 and other 4xx fail immediately

### Phase 13/18 — IMPROVE: Conversation prompt templates
- **Commit**: `a131c56` | **CI**: Passed
- Created `useChatPromptTemplates` hook with localStorage persistence
- 3 seed templates: 总结文本、翻译为中文、头脑风暴
- Mirrors ImageWorkspace pattern

### Phase 14/18 — UIUX: Asset grid and lightbox polish
- **Commit**: `84bc4b5` | **CI**: Passed
- Image scale-on-hover (1.05x, 0.35s ease)
- View hint Eye icon in corner of image previews
- Lightbox button scale hover + active feedback

### Phase 15/18 — IMPROVE: Search filters and saved searches
- **Commit**: `83b7907` | **CI**: Passed
- Role filter (user/assistant), date filter (today/week/month/all)
- Saved searches with localStorage (max 20 saved)
- Filter dropdown UI in MessageSearchBar

### Phase 16/18 — IMPROVE: Lightbox enhancements
- **Commit**: `31f5aa5` | **CI**: Passed
- Image zoom (50-400% via +/-/0 keys and buttons)
- Fullscreen toggle via browser fullscreen API
- Info panel with detailed metadata
- Per-asset zoom persistence
- New keyboard shortcuts: + - 0 I

### Phase 17/18 — CHECK: Final cleanup and code quality
- All 49 tests pass
- TypeScript clean, ESLint 0 warnings
- No unused locals/params
- Bundle 582KB (essentially same as 575KB baseline +7KB for 18 phases)

### Phase 18/18 — IMPROVE: Campaign wrap-up and final polish
- Updated iteration log
- Campaign 002 archived to `.agent/orchestrator-history/campaign-002/`

### Summary
- **18 phases completed** (IMPROVE×10, UIUX×3, CHECK×3, TEST×1, IMPROVE-final×1)
- **49 tests** across **9 test files** (was 27/6 in Campaign 001)
- **Bundle size**: 582KB (gzip 178KB) — +7KB for entire campaign
- **TypeScript**: Clean
- **ESLint**: 0 warnings
- **All CI runs passed** on first try
- **Major additions**:
  - 4 new hooks: `useVideoTaskPersistence`, `useChatPromptTemplates`, `useSavedSearches`, `useAssetMetadata`
  - 6 new components: `OnboardingTour`, `ResultCard`, `AssetMeta`, `SkeletonLoader`, plus lightbox zoom/fullscreen/info panel
  - 1 new library: `fetch` retry with exponential backoff
  - New search capabilities: role/date filters, saved searches
  - New chat features: prompt templates with seed library
  - New lightbox features: zoom, fullscreen, metadata panel
  - New accessibility: dialog role, focus trap, aria-pressed, role=radio

---

## Campaign 003 — 3-Cycle, 18-Phase Campaign (2026-06-19)

**Theme**: Power-user features, navigation, content management, and quality of life

### Phase 1/18 — IMPROVE: Command palette (Cmd+K)
- **Commit**: `3a72a47` | **CI**: Passed
- Global keyboard-driven command palette with fuzzy search
- Grouped commands: navigation, conversations, actions
- Recents + quick actions for new conversation, theme, onboarding

### Phase 2/18 — IMPROVE: Multi-select bulk actions in chat
- **Commit**: `e89bc2b` | **CI**: Passed
- Bulk mode toggle, per-message checkboxes, shift+click range
- Sticky bulk action bar: copy, bookmark, select all

### Phase 3/18 — UIUX: Asset tagging system
- **Commit**: `0b2c5a2` | **CI**: Passed
- User-defined tags with localStorage persistence
- TagPicker popover, tag chips on cards, tag filter in toolbar

### Phase 4/18 — IMPROVE: Stats panel
- **Commit**: `40ba91a` | **CI**: Passed
- 4 stat cards, storage display, 7-day messages chart, asset kind breakdown
- Shown in chat right sidebar

### Phase 5/18 — CHECK: Code review
- Verified project health: 49 tests, clean lint, no TODOs, no console.log

### Phase 6/18 — IMPROVE: Keyboard shortcuts help
- **Commit**: `47b9ca4` | **CI**: Passed
- 18 categorized shortcuts, Cmd+/ and ? shortcuts, filter input
- macOS key formatting

### Phase 7/18 — IMPROVE: Quick Markdown export
- **Commit**: `e38cc82` | **CI**: Passed
- One-click .md file download with timestamps and safe filename

### Phase 8/18 — IMPROVE: Pinned conversations
- **Commit**: `0e69781` | **CI**: Passed
- Pin/unpin toggle, dedicated 置顶 section at top, star icon

### Phase 9/18 — UIUX: PreviewRail gallery view
- **Commit**: `2987f44` | **CI**: Passed
- 2-col grid (3-col expanded), hover scale, expandable, metadata

### Phase 10/18 — IMPROVE: Drag-and-drop file upload
- **Commit**: `17af65a` | **CI**: Passed
- Global drop overlay with visual feedback, multi-file upload

### Phase 11/18 — CHECK: Performance audit
- Verified bundle 602KB healthy, Mermaid/Cytoscape/KaTeX lazy

### Phase 12/18 — IMPROVE: Video preset library
- **Commit**: `9be15d5` | **CI**: Passed
- 5 curated video presets (产品展示/自然风光/城市街景/角色动画/抽象动态)
- One-click apply sets prompt/preset/fps/aspect

### Phase 13/18 — IMPROVE: Settings modal
- **Commit**: `fce5aac` | **CI**: Passed
- Centralized user preferences (image/video/chat)
- 8 preference fields, accessible via command palette

### Phase 14/18 — IMPROVE: Image variations
- **Commit**: `74c0b52` | **CI**: Passed
- 2/3/4 variations in parallel via Promise.allSettled
- Reports success/failure count

### Phase 15/18 — UIUX: Empty states overhaul
- **Commit**: `abe0064` | **CI**: Passed
- 5 enhanced empty states with illustrations and suggestions

### Phase 16/18 — IMPROVE: Context menu (right-click)
- **Commit**: `03e344d` | **CI**: Passed
- Right-click on messages shows copy/edit/thread/pin/bookmark
- Edge-aware positioning, Escape/click-outside close

### Phase 17/18 — CHECK: Final cleanup
- All checks pass, project healthy

### Phase 18/18 — IMPROVE: Campaign wrap-up
- Campaign 003 archived

### Summary
- **18 phases completed** (IMPROVE×10, UIUX×3, CHECK×3, IMPROVE-final×1+1)
- **17 code commits** (Phase 5 and 17 were no-code CHECK phases)
- **All CI runs passed** on first try
- **49 unit tests** across 9 test files (no new tests, but no regressions)
- **Bundle size**: 609KB (gzip 184KB) — +27KB for entire campaign
- **Major additions**:
  - 6 new hooks: `usePinnedConversations`, `useAssetTags`, `useSavedSearches`, `useUserPreferences`, `useShortcutsHelp`, `useVideoPresets`
  - 5 new components: `CommandPalette`, `KeyboardShortcutsHelp`, `TagPicker`, `StatsPanel`, `GlobalDropZone`, `SettingsModal`, `ContextMenu`
  - 1 enhanced component: `EmptyState` with 5 specialized variants
  - 1 enhanced component: `PreviewRail` with grid + expand
  - Image variations (2/3/4 parallel)
  - Video preset library with 5 seed templates
  - Pinned conversations section
  - Asset tagging system
  - Search filters and saved searches
  - Right-click context menu
  - Drag-and-drop file upload
  - Keyboard shortcuts cheat sheet
  - User preferences settings

---

## Campaign 004 — 3-Cycle, 18-Phase Campaign (2026-06-19)

**Theme**: Multi-theme, i18n, PDF/sharing, customization, and quality of life

### Phase 1/18 — IMPROVE: Multi-theme support
- **Commit**: `26f217e` | **CI**: Passed
- 6 themes (light/dark/sepia/ocean/forest/night) with full CSS variables
- useTheme hook with localStorage persistence
- Theme picker UI in Settings with previews
- Command palette actions for each theme

### Phase 2/18 — IMPROVE: Multi-language i18n
- **Commit**: `64f76c9` | **CI**: Passed
- useLanguage hook with zh/en translations (30+ strings)
- TopBar and SettingsModal use t() function
- Language selector in settings

### Phase 3/18 — UIUX: Real PDF export
- **Commit**: `ec7f021` | **CI**: Passed
- Pure-JS PDF generator (no jsPDF dependency)
- PDF includes title, date, role labels, timestamps, content
- A4 page size with text wrapping

### Phase 4/18 — IMPROVE: Conversation sharing
- **Commit**: `af7c226` | **CI**: Passed
- useSharedConversations hook with crypto tokens
- SharedConversationsModal for managing links
- Hash-route SharedRoute for public view

### Phase 5/18 — CHECK: Code review
- Verified project health: 49 tests, clean lint, no TODOs

### Phase 6/18 — IMPROVE: Backup and restore
- **Commit**: `c237c2c` | **CI**: Passed
- BackupRestore component in Settings
- Export 13 localStorage keys to JSON
- Import JSON with validation

### Phase 7/18 — IMPROVE: Custom tab labels
- **Commit**: `25aea5d` | **CI**: Passed
- customTabLabels in user preferences
- 4 text inputs in Settings
- TopBar uses custom labels with fallback

### Phase 8/18 — IMPROVE: Browser notifications
- **Commit**: `bcb860a` | **CI**: Passed
- useNotifications hook with permission management
- Video completion/failure notifications
- Settings toggle

### Phase 9/18 — UIUX: Mobile nav overhaul
- **Commit**: `c963209` | **CI**: Passed
- MobileBottomNav with backdrop blur
- Swipe gesture detection (right opens, left closes)

### Phase 10/18 — IMPROVE: Video tasks panel
- **Commit**: `4ec9970` | **CI**: Passed
- useVideoTaskHistory + VideoTasksPanel
- Status icons, timestamps, link to video
- Auto-tracking on completion

### Phase 11/18 — CHECK: Performance audit
- Verified bundle 633KB healthy

### Phase 12/18 — IMPROVE: Smart prompt suggestions
- **Commit**: `81ad1b1` | **CI**: Passed
- PromptSuggestions with 12 starters and 8 followups
- Shows on empty composer

### Phase 13/18 — IMPROVE: Conversation import
- **Commit**: `6ad06e4` | **CI**: Passed
- ImportConversationButton + parseImportedConversation
- Supports JSON and Markdown

### Phase 14/18 — IMPROVE: Image editor
- **Commit**: `b5b12ca` | **CI**: Passed
- ImageEditor with rotate, crop, text annotation
- Canvas-based, saves as new asset

### Phase 15/18 — UIUX: Onboarding tour updates
- **Commit**: `41cde1e` | **CI**: Passed
- 7 steps (was 5): command palette, themes, shortcuts, sharing, backup
- Updated icons and copy

### Phase 16/18 — IMPROVE: Image comparison
- **Commit**: `650cbea` | **CI**: Passed
- ImageCompare modal for 2-4 images
- Side-by-side with metadata, hover highlight

### Phase 17/18 — CHECK: Final cleanup
- All checks pass, project healthy

### Phase 18/18 — IMPROVE: Campaign wrap-up
- Campaign 004 archived

### Summary
- **18 phases completed** (IMPROVE×10, UIUX×3, CHECK×3, IMPROVE-final×1+1)
- **17 code commits** (Phase 5 and 17 were no-code CHECK phases)
- **All 17 CI runs passed** on first try
- **49 unit tests** across 9 test files
- **Bundle size**: 643KB (gzip 195KB) — +34KB for entire campaign
- **Major additions**:
  - 7 new hooks: `useTheme`, `useLanguage`, `useNotifications`, `useSharedConversations`, `useVideoTaskHistory`, `useVideoTaskQueue`, `useShortcutsHelp`
  - 7 new components: `CommandPalette`, `KeyboardShortcutsHelp`, `GlobalDropZone`, `SettingsModal`, `SharedConversationsModal`, `MobileBottomNav`, `VideoTasksPanel`, `PromptSuggestions`, `ImportConversationButton`, `ImageEditor`, `ImageCompare`, `BackupRestore`
  - 1 utility: pure-JS PDF generator
  - 6 themes
  - Multi-language i18n
  - Custom tab labels
  - Browser notifications
  - Mobile bottom nav
  - Image editor
  - Image comparison
  - PDF export
  - Sharing
  - Import
  - Backup/restore
  - Updated onboarding

---

## Campaign 005 — 2-Cycle, 18-Phase Campaign (2026-06-19)

**Theme**: Smart automation, UI polish, and performance optimization

### Cycle 1 Summary
1. **Phase 1** (DONE): Asset collections with `useCollections` + `CollectionPicker` + `CollectionsManager`
2. **Phase 2** (DONE): Variable expansion `{{date}}`/`{{time}}`/`{{datetime}}` in prompt templates
3. **Phase 3** (DONE): Global search modal with Cmd+Shift+F
4. **Phase 4** (DONE): Usage tracking with `useStatsPanel` (5 event types)
5. **Phase 5** (DONE): Code review clean
6. **Phase 6** (DONE): Voice input via `useSpeechToText` (Web Speech API)

### Cycle 2 Summary
7. **Phase 7** (DONE, `ba05b9e`): Activity heatmap — 12-week calendar grid in StatsPanel
8. **Phase 8** (DONE, `b243ec7`): Auto theme — switch light/dark based on time of day
9. **Phase 9** (DONE, `d1a4cb6`): Lightbox slideshow — auto-advance every 3.5s with play/pause
10. **Phase 10** (DONE, `1c475a2`): Settings profile import/export (theme, language, prefs)
11. **Phase 11** (DONE, `70b67f6`): Bundle optimization — code-split PdfExportButton, StatsPanel, ExportModal (661KB → 651KB)
12. **Phase 12** (DONE, `f5e4f5c`): Smart prompt autocomplete from local history with token+frequency scoring
13. **Phase 13** (DONE, `8c4ee7b`): Smart tag suggestions from filename matching
14. **Phase 14** (DONE, `08d1f3d`): Bulk conversation operations (delete, pin/unpin)
15. **Phase 15** (DONE, `e9bfee7`): Virtualized asset grid via `content-visibility: auto`
16. **Phase 16** (DONE, `a594eca`): Auto-save conversation drafts to localStorage
17. **Phase 17** (DONE, `2ed9900`): Final quality gate — all checks pass
18. **Phase 18** (DONE): Campaign wrap-up

### Final Stats
- **Bundle**: 656KB (gzip 198KB)
- **Tests**: 49/49 pass
- **Phases**: 18/18 complete
- **Commits**: 12 new commits in Cycle 2

---

## Campaign 006 — 1-Cycle, 18-Phase Campaign (2026-06-19)

**Theme**: Smart automation, UI polish, and performance optimization

### Cycle 1 Summary
1. **Phase 1** (DONE, `c929900`): Prompt enhancement tools (rewrite, expand, formal, casual, shorten)
2. **Phase 2** (DONE, `ebc4134`): Asset version history tracking for tag changes
3. **Phase 3** (DONE, `0d9ee68`): Drag-to-folder for conversation organization
4. **Phase 4** (DONE, `3b71eba`): Smart folder auto-categorization by keywords
5. **Phase 5** (DONE): Code review and quality gate
6. **Phase 6** (DONE, `ff6f367`): Asset quality analysis with color-coded badges
7. **Phase 7** (DONE, `de6fa5b`): Batch image download for selected assets
8. **Phase 8** (DONE, `10d63db`): Lightbox annotation mode with line drawing
9. **Phase 9** (DONE, `8c29570`): Keyboard shortcut customization in settings
10. **Phase 10** (DONE, `d9dd938`): Export templates (default, minimal, professional, academic)
11. **Phase 11** (DONE): Performance audit — bundle 661KB, all checks pass
12. **Phase 12** (DONE, `96fa10b`): Workspace defaults memory for image size and style
13. **Phase 13** (DONE, `c086d03`): Asset deduplication scan
14. **Phase 14** (DONE, `d4bc430`): Trend indicators in usage stats
15. **Phase 15** (DONE, `c94a56c`): ShortcutHint component for discoverability
16. **Phase 16** (DONE, `b38f651`): Dominant color extraction for assets
17. **Phase 17** (DONE): Final quality gate — all checks pass
18. **Phase 18** (DONE): Campaign wrap-up

### Final Stats
- **Bundle**: 661KB (gzip 200KB)
- **Tests**: 49/49 pass
- **Phases**: 18/18 complete
- **Commits**: 16 new commits

---

## Campaign 007 — 1-Cycle, 18-Phase Campaign (2026-06-20)

**Theme**: Testing maturity, mobile experience, accessibility expansion, performance optimization, and error handling robustness

### Cycle 1 Summary
1. **Phase 1** (DONE, `3159aa4`): Component test coverage for Campaign 005-006 hooks (+54 tests, 103 total)
2. **Phase 2** (DONE, `4425b46`): Offline support with service worker and offline indicator
3. **Phase 3** (DONE, `43957be`): Mobile gesture components (SwipeableItem, PullToRefresh)
4. **Phase 4** (DONE, `751d0aa`): Error boundary component for graceful error recovery
5. **Phase 5** (DONE, `5226628`): Accessibility audit with ARIA labels, skip-to-content link
6. **Phase 6** (DONE, `dfa3fa9`): Client-side image compression before upload (1MB threshold)
7. **Phase 7** (DONE, `07258d3`): HighlightedText component for search result highlighting
8. **Phase 8** (DONE, `f227ef1`): SkeletonLoader, SkeletonCard, SkeletonMessage components
9. **Phase 9** (DONE, `b1d62e3`): Notion and Obsidian export formats
10. **Phase 10** (DONE, `39e15f2`): usePerformanceMonitor hook for Core Web Vitals
11. **Phase 11** (DONE): Bundle size optimization round 2 — 664KB stable
12. **Phase 12** (DONE, `758318f`): useKeyboardNavigation hook for full keyboard support
13. **Phase 13** (DONE, `c60da72`): IndexedDB wrapper for large data persistence
14. **Phase 14** (DONE, `5d48980`): useNotificationPreferences for per-type preferences
15. **Phase 15** (DONE, `8cf1461`): Dark mode contrast improvements
16. **Phase 16** (DONE, `e5dd21a`): useFormValidation hook for real-time validation
17. **Phase 17** (DONE): Final quality gate — all checks pass
18. **Phase 18** (DONE): Campaign wrap-up

### Final Stats
- **Bundle**: 664KB (gzip 201KB)
- **Tests**: 103/103 pass
- **Phases**: 18/18 complete
- **Commits**: 18 new commits

---

## Campaign 024 — 3-Cycle, 18-Phase Campaign (2026-06-27)

**Theme**: Prompt library productivity, sidebar UX improvements, and visual polish

### Cycle 1 Summary
1. **Phase 1** (DONE, `411d645`): Recently used prompts section in PromptLibrary (+9 tests, 440 total)
2. **Phase 2** (DONE, `78ff7df`): messageCount sort option in Sidebar
3. **Phase 3** (DONE, `9ef4507`): Left border accent on active conversation card
4. **Phase 4** (DONE, `3dad888`): Conversation count badge in folder chips
5. **Phase 5** (DONE): Full audit - all checks pass
6. **Phase 6** (DONE, `79ceabb`): Clear all filters button in Sidebar filter panel

### Cycle 2 Summary
7. **Phase 7** (DONE, `27c5f20`): Total message count stat in Sidebar panel heading
8. **Phase 8** (DONE, `c5c5bd8`): Search input clear button in Sidebar
9. **Phase 9** (DONE, `73c8945`): Left border accent to pinned conversation cards
10. **Phase 10** (DONE, `b4d461f`): Focus ring to Sidebar search input
11. **Phase 11** (DONE): Full audit - all checks pass
12. **Phase 12** (DONE, `0377d33`): Left border accent to active folder chip

### Cycle 3 Summary
13. **Phase 13** (DONE, `d1cfa2e`): Slide-in animation to Sidebar filter panel
14. **Phase 14** (DONE, `14b4046`): Fade-in animation to Sidebar conversation list
15. **Phase 15** (DONE, `35f78c0`): Hover animation to sidebar brand logo
16. **Phase 16** (DONE, `9a4d505`): Scroll fade mask to Sidebar conversation list
17. **Phase 17** (DONE): Final quality gate - all checks pass
18. **Phase 18** (DONE): Campaign wrap-up

### Final Stats
- **Bundle**: ~675KB (gzip 204KB)
- **Tests**: 440/440 pass
- **Phases**: 18/18 complete
- **Commits**: 16 new commits
- **TypeScript**: Clean
- **ESLint**: 0 warnings
- **All CI runs passed**

### Major Additions
- **Recently used prompts** in PromptLibrary with tracking and chip display
- **messageCount sort option** in Sidebar conversation list
- **Visual polish**: left border accents for active/pinned items, focus rings, animations
- **Search input clear button** for quick search reset
- **Clear all filters button** in Sidebar filter panel
- **Conversation count badges** in folder chips
- **Total message count stat** in Sidebar panel heading
- **Scroll fade mask** for better visual hierarchy
- **9 new tests** for usePromptLibrary hook

---

## Campaign 015 — 3-Cycle, 18-Phase Campaign (2026-06-25)

**Theme**: Test coverage expansion, error handling hardening, and code quality improvement

### Cycle 1 Summary
1. **Phase 1** (DONE, `e519dbd`): Test coverage for message action hooks (+43 tests)
2. **Phase 2** (DONE, `e470a98`): Test coverage for conversation management hooks (+53 tests)
3. **Phase 3** (DONE, `fd3f077`): Chat workspace UX polish (hover effects, composer focus, mobile touch targets)
4. **Phase 4** (DONE, `145ea26`): Test coverage for utility functions (+52 tests)
5. **Phase 5** (DONE): Error handling and edge case audit (no issues found)
6. **Phase 6** (DONE, `1c01c46`): Test coverage for settings and preference hooks (+25 tests)

### Cycle 2 Summary
7. **Phase 7** (DONE, `d5c85ce`): Test coverage for asset and media hooks (+28 tests)
8. **Phase 8** (DONE, `031e172`): Test coverage for prompt and template hooks (+23 tests)
9. **Phase 9** (DONE, `1707ac1`): Sidebar and navigation UX improvements (conversation card hover, folder chip interactions)
10. **Phase 10** (DONE, `003bab9`): Test coverage for network and persistence hooks (+11 tests)
11. **Phase 11** (DONE): Code quality and maintainability audit (no issues found)
12. **Phase 12** (DONE, `8b1de0a`): Test coverage for workspace and UI component hooks (+8 tests)

### Cycle 3 Summary
13. **Phase 13** (DONE, `9cd55d6`): Component test coverage for EmptyState (+10 tests)
14. **Phase 14** (DONE): Performance optimization and bundle analysis (674KB, healthy)
15. **Phase 15** (DONE): Accessibility audit and improvements (127 ARIA attributes)
16. **Phase 16** (DONE, `840c77a`): Component test coverage for InfoLine and ConversationTitleInput (+6 tests)
17. **Phase 17** (DONE): Final quality gate and regression check (all pass)
18. **Phase 18** (DONE): Campaign wrap-up

### Final Stats
- **Bundle**: 674KB (gzip 204KB)
- **Tests**: 375/375 pass (up from 116)
- **Phases**: 18/18 complete
- **Commits**: 14 new commits
- **TypeScript**: Clean
- **ESLint**: 0 warnings
- **All CI runs passed**

### Major Additions
- 259 new tests across 28 test files
- 11 new test files for hooks (useMessageReactions, useMessageBookmarking, useMessageForwarding, useMessageEditing, useMessagePinning, useConversationMerging, useConversationArchiving, useConversationFolders, usePinnedConversations, useConversationOrder, useFormValidation, useTheme, useLanguage, useAssetTags, useAssetMetadataEdit, useCollections, usePromptTemplates, useSavedSearches, usePromptEnhance, useOnboarding, useDraftPersistence, useVideoPresets, useShortcutsHelp)
- 6 new test files for utilities (timeFormat, smartFilename, conversationSummary, analyticsExport, conversationExport, imageCompression)
- 3 new test files for components (EmptyState, InfoLine, ConversationTitleInput)
- Chat workspace UX improvements (message hover, composer focus, reaction scale, mobile touch targets)
- Sidebar UX improvements (conversation card hover, folder chip interactions)

### Next Direction
1. Add tests for more complex components (ChatWorkspace, Sidebar, ExportModal)
2. Add integration tests for critical user flows
3. Continue accessibility improvements
4. Performance monitoring and optimization

**Recommended next flagship**: Integration tests for critical user flows (chat, image generation, video generation).

## Campaign 016 — Reliable Creation Loop (2026-06-26)

**Theme**: Make chat, image, and video creation recoverable after failures or refreshes, with shared status UX and production-style validation.

### Completed increments
1. `fc23870` — Defined reliable creation design and execution plan.
2. `f475d21` — Added recoverable chat sending with failed-draft restore and retry.
3. `ba2fa0c` — Added recoverable image generation batches with failed-slot retry.
4. `f0fe0e9` — Unified creation status and recovery UX across workspaces.
5. `d312685` — Preserved video generation recipes on active and failed tasks so users can restore parameters before recreating a video task.
6. In progress — Added a cross-workspace recovery center with a bounded localStorage registry and payload restore into chat, image, and video workspaces.

### Current verification snapshot
- `npx vitest run src/hooks/useVideoTaskPersistence.test.ts`: 7/7 pass.
- `npm test`: 55 files, 387 tests pass.
- `npm run typecheck:functions`: pass.
- `npm run lint`: pass with 0 warnings.
- `npm run build`: pass; existing Vite large chunk warning remains.
- `git diff --check`: pass; Git reports existing LF-to-CRLF normalization warnings only.

### Remaining work
1. Push final health-audit log commit, watch GitHub Actions, and smoke-test the live Pages deployment.

### Health audit snapshot
- `npx wrangler --version`: 4.103.0.
- `npm ci`: pass; npm reported 0 vulnerabilities and only allow-scripts review notices for install scripts.
- `npm test`: 55 files, 387 tests pass.
- `npm run typecheck:functions`: pass.
- `npm run lint`: pass with 0 warnings.
- `npm run build`: pass; existing Vite large chunk warning remains.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilities.
- Source scan: no new plaintext secret findings; sensitive-name hits are environment variable names, workflow secret references, or test placeholders.
- Dangerous HTML scan: two pre-existing explicit render points (`ExportModal`, `MermaidBlock`); no new recovery-loop usage.
- Local Pages smoke: `wrangler pages dev dist --port 8788` served `/` and `/api/session` with HTTP 200, then listener was stopped.

---

## Short Sprint 017 — Product + UI/UX Sprint (2026-06-26)

**Goal**: Run a short two-step sprint: one product-level improvement followed by one UI/UX pass.

### Product improvement
- Continued the reliable-creation direction by upgrading the recovery-only entry into a “创作中心”.
- Added active video task progress and direct navigation back to the video workspace.
- Added recent video outcome visibility while preserving recoverable failure records.
- Validation: `npx vitest run src/components/RecoveryCenter.test.tsx`, `npm test`, `npm run typecheck:functions`, `npm run lint`, `npm run build`, and `git diff --check` passed locally.

### Next
- Run the UI/UX stage as a separate commit focused on the creation center and app-shell experience.

### UI/UX pass
- Added a three-card “创作中心状态概览” so users can quickly distinguish active tasks, recoverable failures, and recent completed videos before scanning the detailed list.
- Added visual emphasis to the floating trigger when there is actionable creation work.
- Tightened hover/focus styling and mobile panel spacing while preserving the existing open/select/dismiss/clear actions.
- Validation: component TDD is green; full local gate passed (`npm test`, functions typecheck, lint, build, diff check); local Pages preview returned 200; in-app Browser desktop and 390×844 mobile interaction checks passed with no console errors or framework overlay.

---

## Short Sprint 018 — Creation Continuity + Mobile Navigation (2026-06-26)

### Product improvement
- Continued the reliable-creation direction by adding recent conversation, recent generated image, and video-workspace shortcuts to the creation center.
- Added a pure tested selector so recent-work ordering is stable, non-mutating, and resilient to invalid timestamps.
- Fixed completed-video summaries so failed or abandoned history is not presented as completed work.
- Fixed premature recovery loss: opening a backup no longer dismisses it before the restored creation succeeds.
- Validation: focused TDD passed; full local gate passed with 56 test files and 392 tests, functions typecheck, lint, and build.

### Next
- Complete the separate UI/UX stage by consolidating duplicate mobile navigation and polishing the small-screen creation flow.

### UI/UX pass
- Removed the legacy mobile tab bar so small screens render one navigation instead of two competing controls.
- Moved the remaining bottom navigation to the app shell so fixed positioning stays inside the viewport, with safe-area spacing, clearer active/focus feedback, and custom workspace labels.
- Repositioned and narrowed the mobile creation-center panel so it remains fully visible and does not overlap the bottom navigation.
- Browser QA at 390×844 caught and drove the app-shell placement fix; final geometry confirmed one navigation, zero legacy navigation, and no overlap.
- Validation: 57 test files and 393 tests, functions typecheck, lint, build, desktop/mobile browser interactions, screenshots, and console checks passed.
- Release: product commit `83d47c1` and UI/UX commit `11d517b` were pushed to `main`; GitHub Actions runs `28200574794` and `28201147320` passed.
- Production smoke: the primary Pages domain and deployment `678d9b0d` returned HTTP 200 for `/` and `/api/session`.

### Next directions
1. Add app-level integration coverage for recovery selection through successful retry completion.
2. Split the large main application bundle around markdown/diagram features.
3. Continue responsive QA at compact landscape and tablet widths.

**Recommended next flagship**: Close the recovery lifecycle automatically only after a restored chat, image, or video creation succeeds.

---

## Long Campaign 019 — Full Reinforcement Loop (2026-06-26)

### Stage 1 — Recovery success lifecycle
- Completed the previous flagship: restored chat, image, and video backups now clear automatically only after real success.
- Chat resolves after the streamed send completes; image resolves after a successful single generation or fully successful batch; partial image failures preserve the backup; video resolves only after the task reaches completed.
- Added a success confirmation and reset of the active recovery context so stale payloads cannot resolve twice.
- Added integration coverage across all three creation workspaces.
- Validation: 58 test files and 397 tests passed; functions typecheck, lint, and build passed.

### Next
- Extend recovery visibility into a user-auditable activity timeline with explicit restored/completed outcomes.

### Stage 2 — Creation activity timeline
- Added a persistent, bounded timeline for restored, completed, and ignored recovery actions.
- The creation center now shows the latest five outcomes with state icons, timestamps, and an explicit clear action.
- Activity storage validates versioned records, ignores corrupt entries, caps history at 30, and avoids unbounded localStorage growth.
- Validation: 59 test files and 400 tests passed; functions typecheck, lint, and build passed.

### Next
- Upgrade the creation center into a clearer two-level mobile/desktop information architecture so continuation, recovery, and history remain scannable as data grows.

---

## Long Campaign 020 — Stage 1 Export Trust Upgrade (2026-06-26)

### Goal
- Continue the export/HTML trust boundary from the previous campaign by making export scope selection predictable and visible.

### Completed
- Fixed a real export bug where date filtering could shift index-based message selection and preview/export the wrong message.
- Replaced export selection indices with stable message keys.
- Added an aria-live export summary pill showing selected/exported count and whether date filtering is active.
- Added regression coverage for selection stability across date filtering.

### Verified
- `npx vitest run src/components/ExportModal.test.tsx` passed.
- `npm test -- --run` passed: 62 files, 405 tests.
- `npm run typecheck:functions`, `npm run lint`, and `npm run build` passed.
- Local Pages served `/` with HTTP 200.
- In-app Browser smoke confirmed app identity, main UI, no framework overlay, and no console warnings/errors.

### CI status
- Commit `aa950ca` passed GitHub Actions run `28208821128` for the full Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 020 Stage 2 with another product-level improvement. Strong candidates: add a richer import/export history surface, improve export preview validation for HTML/PDF, or add critical flow coverage for export/download behavior.

---

## Long Campaign 020 — Stage 2 Export Activity Trail (2026-06-26)

### Goal
- Make successful export actions visible after the modal closes/reopens by adding a bounded, persistent recent-export activity trail.

### Completed
- Added versioned export activity persistence with validation, cap, upsert, and clear behavior.
- Integrated a “最近导出” section in the export modal showing the latest export title, format, message count, and timestamp.
- Recorded successful Markdown, HTML, PDF, text, Notion, and Obsidian export attempts.
- Hardened the early theme bootstrap so missing or blocked `localStorage` cannot blank the app shell before React loads.

### Verified
- RED/GREEN: `npx vitest run src/hooks/useExportActivity.test.ts` failed before the hook existed, then passed after implementation.
- RED/GREEN: `npx vitest run src/themeBootstrap.test.ts` reproduced the unsafe bootstrap failure, then passed after guarding storage/media access.
- Focused tests passed: `npx vitest run src/themeBootstrap.test.ts src/hooks/useExportActivity.test.ts src/components/ExportModal.test.tsx` — 3 files, 6 tests.
- Full local gate passed: `npm test -- --run` — 64 files, 410 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages served `/` with HTTP 200 on `http://127.0.0.1:8793/`.
- System Chrome smoke confirmed a non-empty app shell, correct title, no framework overlay, and no console warnings/errors.

### CI status
- Commit `819f9d5` passed GitHub Actions run `28210390993` for the full Cloudflare Pages deploy workflow. GitHub reported a non-blocking Node.js 20 deprecation annotation for upstream actions forced onto Node 24.

### Next
- Continue Campaign 020 Stage 3 with the required UI/UX pass, focused on making export options and controls easier to scan and operate.

---

## Long Campaign 020 — Stage 3 Export Modal UI/UX Workbench (2026-06-26)

### Goal
- Upgrade the export modal from a growing settings list into a clearer, more trustworthy export workbench.

### Completed
- Added a status overview for range, format, and preview state.
- Made manual-selection empty state explicit: zero selected messages now disables export and shows a clear prompt instead of silently exporting everything.
- Added date field labels, `aria-expanded`, and `aria-pressed` states for better keyboard/screen-reader affordance.
- Added an empty preview state and improved modal body scrolling.
- Added mobile stacking for status cards, date fields, format cards, and template controls.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed on missing `aria-expanded`, then passed after the UI/UX changes.
- Full local gate passed: `npm test -- --run` — 64 files, 411 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages served `/` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors. Authenticated export-modal flow is covered by component TDD because browser entry is gated by private access.

### CI status
- Commit `c17a6f8` passed GitHub Actions run `28210699681` for the full Cloudflare Pages deploy workflow. GitHub reported the same non-blocking Node.js 20 deprecation annotation for upstream actions forced onto Node 24.

### Next
- Continue Campaign 020 Stage 4 with a product improvement. Best candidate: add a lightweight copy-to-clipboard export action or stronger export filename/format feedback using the new workbench structure.

---

## Long Campaign 020 — Stage 4 Export Copy Action (2026-06-26)

### Goal
- Let users reuse the current export payload without downloading a file by adding a copy-to-clipboard export action.

### Completed
- Added a `复制内容` footer action using the same export payload as preview/download.
- Added success and failure status feedback for clipboard writes.
- Kept copy disabled when there is no exportable content, matching the safer export guard from Stage 3.
- Removed a synchronous setState-in-effect pattern caught by lint and kept copy status event-driven.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed before the copy button existed, then passed after implementation.
- Full local gate passed: `npm test -- --run` — 64 files, 412 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages served `/` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors. Authenticated export-copy flow is covered by component TDD because browser entry is gated by private access.

### CI status
- Commit `ca5c554` passed GitHub Actions run `28210953185` for the full Cloudflare Pages deploy workflow. GitHub reported the same non-blocking Node.js 20 deprecation annotation for upstream actions forced onto Node 24.

### Next
- Continue Campaign 020 Stage 5 CHECK with a broad local/CI health audit and use its findings to drive the final improvement.

---

## Long Campaign 020 — Stage 5 CI Health Check (2026-06-26)

### Goal
- Run a broad project health check and fix a concrete CI/runtime maintenance issue before the final improvement stage.

### Completed
- Audited workflow, package scripts, dependencies, debug markers, secret-like strings, local Pages, `/api/session`, and browser shell behavior.
- Refreshed GitHub Actions runtimes to official latest releases:
  - `actions/checkout@v7.0.0`
  - `actions/setup-node@v6.4.0`
  - `gitleaks/gitleaks-action@v3.0.0`
- Removed the compatibility `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` env now that the actions themselves are updated.
- Diagnosed local `npm ci` `EBUSY` as a current-repo wrangler/miniflare lock and reran successfully after stopping the dev server.

### Verified
- Official latest action tags verified through `gh api`.
- `npm ci` passed with 0 vulnerabilities; npm reported allow-scripts review notices for `esbuild`, `sharp`, and `workerd`.
- Full local gate passed: `npm test -- --run` — 64 files, 412 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors.

### CI status
- Commit `04fdb9a` passed GitHub Actions run `28217721452` for the full Cloudflare Pages deploy workflow. The previous Node.js 20 action-runtime deprecation annotation did not appear in the watch output after refreshing action versions.

### Next
- Continue Campaign 020 Stage 6 with the final product/stability improvement. Strong candidate: make clipboard export gracefully handle browsers without Clipboard API or insecure contexts.

---

## Long Campaign 020 — Stage 6 Export Copy Fallback (2026-06-26)

### Goal
- Finish the long loop by hardening the export copy action for browsers or contexts where Clipboard API is unavailable.

### Completed
- Added a tested `copyTextToClipboard` helper in `ExportModal`.
- Preferred `navigator.clipboard.writeText` when available.
- Added fallback through an off-screen readonly textarea and `document.execCommand("copy")`.
- Preserved existing success/error status feedback and disabled-copy behavior for empty exports.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed before fallback support, then passed after implementation.
- Full local gate passed: `npm test -- --run` — 64 files, 413 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- `git diff --check` passed with only existing LF-to-CRLF normalization warnings.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors. Authenticated copy fallback is covered by component TDD because browser entry is gated by private access.

### CI status
- Commit `bc5cdbe` passed GitHub Actions run `28217920387` for the full Cloudflare Pages deploy workflow.

### Remaining risks / next directions
- Browser-level authenticated export interaction remains gated locally by private access, so modal behavior is covered by component tests rather than an authenticated browser E2E.
- npm still reports allow-scripts review notices for `esbuild`, `sharp`, and `workerd`; this is non-blocking but should be reviewed deliberately if the repo adopts npm script approvals.
- Next high-value improvement: add an authenticated E2E fixture or test-mode session route so export modal flows can be verified in a real browser without production credentials.

---

## Long Campaign 021 — Stage 1 Safe Export Filename Preview (2026-06-26)

### Goal
- Continue the export reliability thread by making the exact download filename visible and safe before export.

### Completed
- Added deterministic safe filename generation by export format.
- Added fallback to `未命名导出` when a conversation title contains only invalid filename characters.
- Reused the same safe filename for download paths and showed it in the export workbench through an accessible `导出文件名` preview.
- Added truncation styling so long filenames remain readable without breaking the modal.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed before the filename preview existed, then passed after implementation.
- Full local gate passed: `npm test -- --run` — 64 files, 414 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors.

### CI status
- Commit `8334cc3` passed GitHub Actions run `28218588951` for the full Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 021 Stage 2 with another export reliability increment. Best candidate: make the chosen export format visibly tied to filename/extension changes and guard copy/download status when switching formats.

---

## Long Campaign 021 — Stage 2 Export Copy Status Freshness (2026-06-26)

### Goal
- Ensure copy success/error feedback only applies to the currently visible export payload, not a previous format or range.

### Completed
- Added a regression test for copying Markdown, switching to `纯文本`, clearing stale success feedback, and showing the `.txt` filename.
- Stored the preview payload associated with the last copy result.
- Hid copy status automatically whenever the current preview content no longer matches the copied payload.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed on the stale success status after format change, then passed after implementation.
- Full local gate passed: `npm test -- --run` — 64 files, 415 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors.

### CI status
- Commit `19e98d2` passed GitHub Actions run `28218803959` for the full Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 021 Stage 3 UI/UX. Best candidate: improve export workbench feedback clarity around copy/download status and filename/format relationship without increasing modal complexity.

---

## Long Campaign 021 — Stage 3 Export Copy Action UX (2026-06-26)

### Goal
- Make the footer copy action reflect when the currently visible export payload has already been copied.

### Completed
- Added a regression assertion that copy success changes the footer action to `重新复制内容`.
- Added a derived `copyButtonLabel` from the content-aware visible copy status.
- Kept the button label at `复制内容` for idle, error, disabled, and stale-payload states.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed before the button label changed, then passed after implementation.
- Full local gate passed: `npm test -- --run` — 64 files, 415 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors.

### CI status
- Commit `1fd4121` passed GitHub Actions run `28218987031` for the full Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 021 Stage 4 IMPROVE. Best candidate: add a more precise PDF filename/status behavior or strengthen export activity metadata with filename visibility.

---

## Long Campaign 021 — Stage 4 Export Activity Filenames (2026-06-26)

### Goal
- Make recent export history traceable to the actual safe filename used at export time.

### Completed
- Added optional `filename` support to `ExportActivity`.
- Preserved valid filename fields when loading persisted history.
- Recorded the computed safe filename when users export.
- Displayed the filename in the recent export list with truncation styling.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed before recent exports showed `filename`, then passed after implementation; `src/hooks/useExportActivity.test.ts` also passed.
- Full local gate passed: `npm test -- --run` — 64 files, 415 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors.

### CI status
- Commit `bf3e71c` passed GitHub Actions run `28219189866` for the full Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 021 Stage 5 CHECK with broad health/security/deploy audit before final improvement.

---

## Long Campaign 021 — Stage 5 Export Activity Filename Check (2026-06-26)

### Goal
- Audit the current export-history work and fix a persisted-data quality gap before the final improvement.

### Completed
- Ran high-severity npm audit: 0 vulnerabilities.
- Rechecked workflow action latest tags: checkout `v7.0.0`, setup-node `v6.4.0`, gitleaks-action `v3.0.0`.
- Ran a secret/debug marker scan; matches were expected code/test/doc variable names and API-key plumbing, not committed plaintext secrets.
- Added export filename normalization for persisted and newly recorded activity entries: trim, omit empty values, cap at 128 characters.

### Verified
- RED/GREEN: `npx vitest run src/hooks/useExportActivity.test.ts` failed before filename normalization, then passed after implementation; `src/components/ExportModal.test.tsx` also passed.
- Full local gate passed: `npm test -- --run` — 64 files, 416 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors.

### CI status
- Commit `0152c1c` passed GitHub Actions run `28219421675` for the full Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 021 Stage 6 final IMPROVE. Best candidate: add a compact export history test/UX around filename preservation during actual record calls or improve PDF fallback filename clarity.

---

## Long Campaign 021 — Stage 6 PDF Filename Preview (2026-06-26)

### Goal
- Correct the PDF export filename preview so it matches the selected PDF format.

### Completed
- Added a regression test that selects PDF and expects a `.pdf` filename preview.
- Updated export extension mapping so PDF previews and activity records use `.pdf`.
- Kept Notion/Obsidian outputs as markdown-compatible `.md`.

### Verified
- RED/GREEN: `npx vitest run src/components/ExportModal.test.tsx` failed when PDF showed `.md`, then passed after the extension mapping fix.
- Full local gate passed: `npm test -- --run` — 64 files, 417 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.
- Local Pages served `/` and `/api/session` with HTTP 200.
- System Chrome desktop and 390×844 mobile smoke confirmed app-shell load, no horizontal overflow, no framework overlay, and no console warnings/errors.

### CI status
- Commit `b75e430` passed GitHub Actions run `28219608496` for the full Cloudflare Pages deploy workflow.

### Remaining risks / next directions
- Browser-level authenticated export interaction remains gated locally by private access, so export modal behavior is covered by component tests rather than authenticated browser E2E.
- npm still emits the Node experimental localStorage warning during Vitest, but it is non-blocking and does not fail tests.
- Next high-value direction: add a dedicated authenticated test fixture or test-mode session route so export modal flows can be verified in real browser automation without production credentials.

### Campaign status
- Long Campaign 021 completed all six required stages with local validation, commits, pushes, GitHub Actions verification, and final deployment smoke pending this log-closing commit.

---

## Long Campaign 022 — Stage 1 Guarded E2E Session Fixture (2026-06-26)

### Goal
- Start the next long loop by removing the blocker that kept real browser checks at the private access gate.

### Completed
- Added a default-disabled `POST /api/session/test` endpoint for local/CI browser automation.
- Guarded the endpoint with `E2E_SESSION_SECRET` plus a matching `x-cstd-e2e-secret` header.
- Reused normal session creation for test sessions instead of adding a frontend-only bypass.
- Kept production/HTTPS cookies secure while allowing local `127.0.0.1` and `localhost` HTTP automation to persist HttpOnly cookies.
- Documented the fixture in `.dev.vars.example` and `README.md`.

### Verified
- RED/GREEN: `npx vitest run functions/_shared/core.test.ts` failed before the E2E session guard existed, then passed.
- RED/GREEN: local HTTP cookie strategy failed before `sessionCookieShouldBeSecure`, then passed after implementation.
- Full local gate passed: `npm test -- --run` — 64 files, 419 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Local Pages endpoint checks confirmed wrong/missing secret denial and matching-secret session creation.
- Authenticated System Chrome desktop and 390×844 mobile smoke entered the app shell, bypassing the prior private-access testing blocker without using production credentials.

### CI status
- Pending commit/push for this stage.

### Next
- Continue Campaign 022 Stage 2 with an authenticated browser-verifiable export flow improvement now that the test fixture exists.

---

## Long Campaign 022 — Stage 2 Authenticated Export Browser Smoke (2026-06-26)

### Goal
- Turn the new test-session fixture into a repeatable real-browser check for authenticated export behavior.

### Completed
- Added deterministic E2E export fixture content.
- Added guarded `POST /api/session/test/fixture`, protected by the same `E2E_SESSION_SECRET` header contract.
- Added `npm run smoke:auth-export` to seed a test session, create a fixture conversation, open the authenticated app shell, verify the advanced export modal, verify Markdown/PDF filename previews, copy generated Markdown export content, and check for overflow/console errors.
- Fixed authenticated desktop toolbar hit testing by moving chat row actions onto their own wrapping row instead of letting them extend under the right panel.
- Cached and serialized `ensureSchema` per D1 binding instance to avoid repeated concurrent local D1 DDL initialization errors during browser smoke.
- Documented the authenticated export smoke command in `README.md`.

### Verified
- RED: `npx vitest run functions/_shared/core.test.ts` failed before `buildE2EExportFixture` existed.
- GREEN: `npx vitest run functions/_shared/core.test.ts` — 1 file, 21 tests passed.
- `npm run smoke:auth-export` initially exposed real blockers: shell selector mismatch, onboarding overlay, toolbar/right-panel pointer interception, and local D1 schema-init flake; all were fixed and reverified.
- Final `npm run smoke:auth-export` on local Pages `127.0.0.1:8794` passed with System Chrome and copied fixture export content.
- Full local gate passed: `npm test -- --run` — 64 files, 420 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.

### CI status
- Pending commit/push for this stage.

### Next
- Continue Campaign 022 Stage 3 UI/UX with a visible export-workflow refinement now covered by authenticated browser smoke.

---

## Long Campaign 022 — Stage 3 Export Filename Copy UX (2026-06-26)

### Goal
- Improve the export modal workflow with a directly usable filename copy affordance.

### Completed
- Added a dedicated “复制文件名” action beside the export filename preview.
- Added independent success/error feedback for filename copying so it does not conflict with export-content copy status.
- Kept filename copy feedback tied to the current computed filename, so changing format/title invalidates stale status.
- Updated the authenticated export smoke to verify copying the Markdown filename in a real browser before checking preview/PDF/content copy.

### Verified
- RED: `npx vitest run src/components/ExportModal.test.tsx` failed because no accessible “复制文件名” button existed.
- GREEN: `npx vitest run src/components/ExportModal.test.tsx` — 1 file, 9 tests passed.
- Full local gate passed: `npm test -- --run` — 64 files, 421 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Authenticated local Pages browser smoke passed via `npm run smoke:auth-export`, including filename-copy verification.

### CI status
- Pending commit/push for this stage.

### Next
- Continue Campaign 022 Stage 4 IMPROVE with another export-flow or reliability improvement now covered by component and browser smoke.

---

## Long Campaign 022 — Stage 4 Export Preferences Persistence (2026-06-26)

### Goal
- Preserve the user's last export format/template choice across modal sessions.

### Completed
- Added safe localStorage-backed export preferences for format and template.
- Validated stored preference values before use; damaged or unknown values fall back to Markdown/default.
- Extended authenticated browser smoke to confirm PDF format persists after closing and reopening the export modal.

### Verified
- RED: `npx vitest run src/components/ExportModal.test.tsx` failed because the second modal session reset to `.md`.
- GREEN: `npx vitest run src/components/ExportModal.test.tsx` — 1 file, 10 tests passed.
- Full local gate passed: `npm test -- --run` — 64 files, 422 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Authenticated local Pages browser smoke passed via `npm run smoke:auth-export`, including persisted PDF format verification after modal reopen.

### CI status
- Pending commit/push for this stage.

### Next
- Continue Campaign 022 Stage 5 CHECK with systemic audit, targeted fixes, and full verification.

---

## Long Campaign 022 — Stage 5 Export Preference Backup Check (2026-06-26)

### Goal
- Systemically audit the recent export-preference work and fix persistence/backup consistency gaps.

### Completed
- Ran high-severity npm audit: 0 vulnerabilities.
- Scanned for secret-like markers; matches were expected env names, docs, tests, and sample variables.
- Audited localStorage usage after adding export preferences.
- Found and fixed a backup/restore gap: `cstd-design:export-preferences` was not included in `BACKUP_KEYS`.
- Centralized `EXPORT_PREFERENCES_STORAGE_KEY` in `storage-keys.ts` and reused it from `ExportModal`.
- Added storage key backup coverage.

### Verified
- RED: `npx vitest run src/storage-keys.test.ts` failed because `BACKUP_KEYS` did not include the export preference key.
- GREEN: `npx vitest run src/storage-keys.test.ts src/components/ExportModal.test.tsx src/components/OnboardingTour.test.tsx` — 3 files, 12 tests passed.
- Full local gate passed: `npm test -- --run` — 65 files, 423 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Authenticated local Pages browser smoke passed via `npm run smoke:auth-export`.

### CI status
- Pending commit/push for this stage.

### Next
- Continue Campaign 022 Stage 6 final IMPROVE and final full verification.

---

## Long Campaign 022 — Stage 6 Backup Preview Labels Final Improve (2026-06-26)

### Goal
- Finish the loop with a small backup/restore UX improvement tied to the Stage 5 backup coverage fix.

### Completed
- Added reader-facing Chinese labels for backup keys.
- Updated backup import preview to use friendly labels instead of raw internal storage key fragments.
- Added coverage that export preferences render as `导出偏好`.

### Verified
- RED: `npx vitest run src/storage-keys.test.ts` failed because `BACKUP_KEY_LABELS` did not exist.
- GREEN: `npx vitest run src/storage-keys.test.ts src/components/OnboardingTour.test.tsx` — 2 files, 3 tests passed.
- Final full local gate passed: `npm test -- --run` — 65 files, 424 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.
- Final authenticated local Pages browser smoke passed via `npm run smoke:auth-export`.

### CI status
- Commit `d423ee9` passed GitHub Actions run `28234111543` for the complete Cloudflare Pages deploy workflow.

### Campaign status
- Final live smoke passed:
  - `https://cbaad505.cstd-design.pages.dev/` — HTTP 200, title `工作台 - 私人中文创作工作台`; `/api/session` returned unauthenticated JSON.
  - `https://cstd-design.pages.dev/` — HTTP 200, title `工作台 - 私人中文创作工作台`; `/api/session` returned unauthenticated JSON.
  - `https://design.custard.top/` — HTTP 200, title `工作台 - 私人中文创作工作台`; `/api/session` returned unauthenticated JSON.
- Long Campaign 022 completed all six required stages with code/log changes, local validation, browser smoke, commits, pushes, GitHub Actions verification, and live smoke.

---

## Long Campaign 023 — Stage 1 Backup Import Overwrite Status (2026-06-26)

### Goal
- Make backup import previews safer by showing whether each incoming setting is new or will overwrite existing local data.

### Completed
- Added component coverage for backup preview import status.
- Added `将覆盖` / `新增` badges to backup preview rows.
- Styled preview rows so labels remain readable while status stays prominent.

### Verified
- RED: `npx vitest run src/components/BackupRestore.test.tsx` failed before overwrite/new status existed.
- GREEN: `npx vitest run src/components/BackupRestore.test.tsx` — 1 file, 1 test passed.
- Full local gate passed: `npm test -- --run` — 66 files, 425 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.

### CI status
- Commit `9ea5986` passed GitHub Actions run `28234694996` for the complete Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 023 Stage 2 with a backup/restore improvement that makes merge import outcomes more explicit after confirmation.

---

## Long Campaign 023 — Stage 2 Backup Merge Import Result Counts (2026-06-26)

### Goal
- Make merge import completion feedback explicit about imported and skipped existing settings.

### Completed
- Added coverage for merge import with one existing setting and one new setting.
- Updated backup restore import logic to count skipped existing keys in merge mode.
- Preserved the existing local value while importing the new setting and reporting both counts.

### Verified
- RED: `npx vitest run src/components/BackupRestore.test.tsx` failed because the merge notice did not include skipped settings.
- GREEN: `npx vitest run src/components/BackupRestore.test.tsx` — 1 file, 2 tests passed.
- Full local gate passed: `npm test -- --run` — 66 files, 426 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.

### CI status
- Commit `8bda7f1` passed GitHub Actions run `28234936061` for the complete Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 023 Stage 3 UI/UX with a visual refinement that makes backup import choices and consequences easier to scan.

---

## Long Campaign 023 — Stage 3 Backup Import Impact Summary UI (2026-06-26)

### Goal
- Make backup import preview consequences scannable before choosing merge or overwrite import.

### Completed
- Added a compact `导入影响摘要` block above preview rows.
- Shows overwrite/new counts at a glance.
- Explains that merge import skips existing settings while overwrite import replaces them.
- Added visual styling for the summary card.

### Verified
- RED: `npx vitest run src/components/BackupRestore.test.tsx` failed before the summary existed.
- GREEN: `npx vitest run src/components/BackupRestore.test.tsx` — 1 file, 3 tests passed.
- Full local gate passed: `npm test -- --run` — 66 files, 427 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.
- Authenticated local Pages browser smoke passed via `npm run smoke:auth-export` against `http://127.0.0.1:8793`.

### CI status
- Commit `f55a394` passed GitHub Actions run `28235283266` for the complete Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 023 Stage 4 with a restore reliability improvement around unsupported backup keys.

---

## Long Campaign 023 — Stage 4 Unsupported Backup Key Warning (2026-06-26)

### Goal
- Make backup imports transparent when a file contains unsupported data that will be ignored.

### Completed
- Added preview coverage for unsupported backup keys.
- Counted unsupported keys in the backup payload.
- Added `将忽略 N 项不支持数据。` to the import impact summary only when needed.
- Kept unsupported raw keys hidden from preview rows.

### Verified
- RED: `npx vitest run src/components/BackupRestore.test.tsx` failed before the unsupported-key warning existed.
- GREEN: `npx vitest run src/components/BackupRestore.test.tsx` — 1 file, 4 tests passed.
- Full local gate passed: `npm test -- --run` — 66 files, 428 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.

### CI status
- Commit `788f3ad` passed GitHub Actions run `28235526186` for the complete Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 023 Stage 5 CHECK with a systemic audit of backup restore edge cases and coverage gaps.

---

## Long Campaign 023 — Stage 5 Recovery Center Backup Coverage Check (2026-06-26)

### Goal
- Audit backup/restore coverage after the preview improvements and fix any real persisted-data gap.

### Completed
- Ran high-severity npm audit: 0 vulnerabilities.
- Scanned secret-like markers; hits were expected env names/docs/tests/workflow references and CSS class text.
- Audited localStorage usage and found recovery-center data was persisted but not backed up.
- Centralized recovery storage keys in `storage-keys.ts`.
- Added recovery backup and recovery activity keys to `BACKUP_KEYS`.
- Added reader-facing labels `恢复备份` and `恢复记录`.
- Updated recovery hooks to reuse centralized constants while preserving existing exports.

### Verified
- RED: `npx vitest run src/storage-keys.test.ts` failed before recovery center keys were included.
- GREEN: targeted recovery/backup test set passed — 5 files, 20 tests.
- Full local gate passed: `npm test -- --run` — 66 files, 430 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.

### CI status
- Commit `b5fface` passed GitHub Actions run `28238191693` for the complete Cloudflare Pages deploy workflow.

### Next
- Continue Campaign 023 Stage 6 final IMPROVE with a final backup-restore usability/reliability increment and full final verification.

---

## Long Campaign 023 — Stage 6 Block Empty Backup Imports Final Improve (2026-06-26)

### Goal
- Prevent no-op backup imports when a file contains no supported settings.

### Completed
- Added coverage for backups containing only unsupported keys.
- Added `没有可导入的设置。` to the import impact summary.
- Disabled both merge and overwrite import buttons when no supported settings are present.

### Verified
- RED: `npx vitest run src/components/BackupRestore.test.tsx` failed before empty-import blocking existed.
- GREEN: `npx vitest run src/components/BackupRestore.test.tsx src/storage-keys.test.ts` — 2 files, 9 tests passed.
- Final full local gate passed: `npm test -- --run` — 66 files, 431 tests; `npm run typecheck:functions`; `npm run lint`; `npm audit --audit-level=high`; `npm run build`.
- Final authenticated local Pages browser smoke passed via `npm run smoke:auth-export` against `http://127.0.0.1:8793`.

### CI status
- Commit `6638183` passed GitHub Actions run `28238481817` for the complete Cloudflare Pages deploy workflow.

### Campaign status
- Final live smoke passed:
  - `https://0fcedca9.cstd-design.pages.dev/` — HTTP 200, title `工作台 - 私人中文创作工作台`; `/api/session` returned unauthenticated JSON.
  - `https://cstd-design.pages.dev/` — HTTP 200, title `工作台 - 私人中文创作工作台`; `/api/session` returned unauthenticated JSON.
  - `https://design.custard.top/` — HTTP 200, title `工作台 - 私人中文创作工作台`; `/api/session` returned unauthenticated JSON.
- Note: `https://6638183.cstd-design.pages.dev/` was checked first but is not the actual Pages deployment alias and returned Cloudflare `Deployment Not Found`.
- Long Campaign 023 completed all six required stages with local validation, authenticated browser smoke, commits, pushes, GitHub Actions verification, and live smoke.

---

## Long Campaign 025 — Stage 1 Asset Type Sorting (2026-06-28)

### Goal
- Improve the asset library sort controls by adding a type-grouped ordering and moving sorting logic into the shared app-state layer.

### Completed
- Added `AssetSortMode` and `sortAssets` to `src/app-state.ts`.
- Added `kindAsc` sorting with order `upload → image → video` and newest-first ordering inside each type.
- Replaced the Asset Workspace's local sort helper with the shared tested helper.
- Added the `类型分组` dropdown option.

### Verified
- RED: `npm test -- src/app-state.test.ts` failed before the shared `sortAssets` helper existed.
- GREEN: `npm test -- src/app-state.test.ts` — 1 file, 9 tests passed.
- Full local gate passed: `npm test` — 67 files, 441 tests; `npm run lint`; `npm run build`.

### Next
- Continue Campaign 025 Stage 2 with another product-facing asset-workspace improvement, then commit/push and verify CI for each stage.

### CI status
- Commit `6c55bc3` passed GitHub Actions run `28298169659`.

---

## Long Campaign 025 — Stage 2 Asset Sort Preference Persistence (2026-06-28)

### Goal
- Keep the selected Asset Workspace sort mode after refreshes and new sessions.

### Completed
- Added `ASSET_SORT_STORAGE_KEY` to central storage keys.
- Added validated asset sort preference read/write helpers.
- Loaded the Asset Workspace sort dropdown from storage.
- Persisted future sort dropdown changes while safely ignoring unavailable/full storage.

### Verified
- RED: `npm test -- src/app-state.test.ts` failed before the persistence API existed.
- GREEN: `npm test -- src/app-state.test.ts` — 1 file, 10 tests passed.
- Full local gate passed: `npm test` — 67 files, 442 tests; `npm run lint`; `npm run build`; `npm run typecheck:functions`.

### Next
- Continue Campaign 025 Stage 3 UIUX with a visual clarity improvement for the asset toolbar.

### CI status
- Commit `b3067a7` passed GitHub Actions run `28298309106`.

---

## Long Campaign 025 — Stage 3 Asset Sort Summary UIUX (2026-06-28)

### Goal
- Make the current Asset Workspace sort mode visible in the main content area after the user changes it.

### Completed
- Added a shared `assetSortLabel` helper.
- Added a visible `排序：...` summary chip beside the file count and total size.
- Styled the chip with soft panel background, border, and compact pill spacing.

### Verified
- RED: `npm test -- src/app-state.test.ts` failed before `assetSortLabel` existed.
- GREEN: `npm test -- src/app-state.test.ts` — 1 file, 11 tests passed.
- Full local gate passed: `npm test` — 67 files, 443 tests; `npm run lint`; `npm run build`; `npm run typecheck:functions`.

### Next
- Continue Campaign 025 Stage 4 IMPROVE with another asset-workspace reliability/product increment.

### CI status
- Commit `a1096cf` passed GitHub Actions run `28298436168`.

---

## Long Campaign 025 — Stage 4 Asset Selection Reset Reliability (2026-06-28)

### Goal
- Prevent selected-but-hidden assets from remaining in batch action state after the user changes asset filters.

### Completed
- Added Asset Workspace test cleanup to keep component tests isolated.
- Added a regression test that preloads asset tags, selects all assets, then switches a tag filter.
- Added a shared `resetSelection` helper.
- Applied selection reset to type filters, collection filters, and tag filters.
- Reset the shift-click anchor together with selected asset IDs.

### Verified
- RED: `npm test -- src/components/AssetWorkspace.test.tsx` failed because tag filtering still showed `已选 2 项`.
- GREEN: `npm test -- src/components/AssetWorkspace.test.tsx` — 1 file, 2 tests passed.
- Full local gate passed: `npm test` — 67 files, 444 tests; `npm run lint`; `npm run build`; `npm run typecheck:functions`.

### Next
- Continue Campaign 025 Stage 5 CHECK with a systematic review of persisted storage coverage and release risks.

### CI status
- Commit `5393f78` passed GitHub Actions run `28298578827`.

---

## Long Campaign 025 — Stage 5 Storage Backup Coverage CHECK (2026-06-28)

### Goal
- Check whether the new persisted asset sort preference created backup/security/release gaps.

### Completed
- Ran `npm audit --audit-level=high`: 0 vulnerabilities.
- Scanned secret-like markers; hits were expected examples, docs, tests, env names, and function references.
- Audited references for `ASSET_SORT_STORAGE_KEY`, `BACKUP_KEYS`, and `BACKUP_KEY_LABELS`.
- Found `cstd-design:assetSortMode` was persisted but not included in Backup/Restore settings coverage.
- Added the asset sort preference key to `BACKUP_KEYS`.
- Added backup preview label `素材排序偏好`.

### Verified
- RED: `npm test -- src/storage-keys.test.ts` failed because `BACKUP_KEYS` omitted `ASSET_SORT_STORAGE_KEY`.
- GREEN: `npm test -- src/storage-keys.test.ts` — 1 file, 5 tests passed.
- Full local gate passed: `npm test` — 67 files, 445 tests; `npm run lint`; `npm run build`; `npm run typecheck:functions`; `npm audit --audit-level=high`.

### Next
- Continue Campaign 025 Stage 6 final IMPROVE with one final small product increment and final live verification.

### CI status
- Commit `1ff03e7` passed GitHub Actions run `28298808984`.

---

## Long Campaign 025 — Stage 6 Restore Default Asset Sort (2026-06-28)

### Goal
- Give users a direct way to undo a persisted non-default Asset Workspace sort choice.

### Completed
- Added a contextual `恢复默认排序` button beside the active sort summary.
- Reset the current and stored sort mode to `dateDesc` from one interaction handler.
- Hid the action when `最新优先` is already active.

### Verified
- RED: `npm test -- src/components/AssetWorkspace.test.tsx` failed because the reset button was absent.
- GREEN: `npm test -- src/components/AssetWorkspace.test.tsx` — 1 file, 3 tests passed.
- Full local gate passed: `npm test` — 67 files, 446 tests; `npm run lint`; `npm run build`; `npm run typecheck:functions`; `npm audit --audit-level=high`; `git diff --check`.
- Authenticated local Pages browser smoke passed for seeded session/export flow, clipboard checks, export preference persistence, runtime console, and horizontal overflow.

### Next
- Campaign 025 is complete. Start a new campaign only for a new product or reliability objective.

### CI and live status
- Commit `109c8f5` passed GitHub Actions run `28299027843`.
- Cloudflare production deployment `96a61b37-4e58-498d-aa69-45266ffd822d` points to source `109c8f5`.
- Direct Pages and custom domains returned HTTP 200 for the app shell and `/api/session`.

---

## Long Campaign 026 — Stage 1 Creation Center Priority Action (2026-06-28)

### Goal
- Surface the next best Creation Center continuity action immediately when recoverable work exists.

### Completed
- Added a `建议先处理` recommendation region.
- Prioritized active video generation first, then the newest recoverable creation record.
- Added a one-click recommendation action that opens the matching active task or recovery record and closes the panel.
- Added responsive styling for the recommendation card.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the recommendation region existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 8 tests passed.
- Full local gate passed: `npm test` — 67 files, 447 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.

### CI status
- Commit `c1167f6` passed GitHub Actions run `28299844519`.

---

## Long Campaign 026 — Stage 2 Pending Work Type Filters (2026-06-28)

### Goal
- Make mixed Creation Center pending work easier to triage by type.

### Completed
- Added `全部 / 咨询 / 图片 / 视频` pending-work filter chips.
- Counted active video work in the video bucket and recovery records in their workspace buckets.
- Filtered active tasks, recovery records, and recent video results consistently.
- Added an empty filtered-state message when the current type has no pending work.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the filter group existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 9 tests passed.
- Full local gate passed: `npm test` — 67 files, 448 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.

### CI status
- Commit `e685716` passed GitHub Actions run `28299975080`.

---

## Long Campaign 026 — Stage 3 Pending Filter Summary UIUX (2026-06-28)

### Goal
- Improve Creation Center filter clarity with visible interaction feedback and mobile validation.

### Completed
- Added a live `待处理筛选摘要` status line below task filters.
- Showed whether the panel is displaying all pending work or one workspace type.
- Styled the summary as a compact feedback strip.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the filter summary status existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 10 tests passed.
- Full local gate passed: `npm test` — 67 files, 449 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.
- Mobile browser verification passed against `wrangler pages dev dist` at `390x844`: authenticated app shell, seeded recovery records, filter summary, no horizontal overflow, no console warnings/errors.

### CI status
- Commit `36eff27` passed GitHub Actions run `28300163888`.

---

## Long Campaign 026 — Stage 4 Filtered Recovery Cleanup (2026-06-28)

### Goal
- Reduce destructive recovery cleanup risk by clearing only the currently filtered recovery type.

### Completed
- Added contextual `清空{类型}恢复记录` actions for specific pending-work filters.
- Dismissed only visible records in the active filter.
- Kept the existing all-record clear action available only in the `全部` filter.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before `清空咨询恢复记录` existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 11 tests passed.
- Full local gate passed: `npm test` — 67 files, 450 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`.

### CI status
- Commit `c089265` passed GitHub Actions run `28305133528`.

---

## Long Campaign 026 — Stage 5 Recovery Storage Failure CHECK (2026-06-28)

### Goal
- Audit Creation Center recovery changes for storage, safety, dependency, and release risks.

### Completed
- Ran `npm audit --audit-level=high`: 0 vulnerabilities.
- Scanned secret-like markers; hits were expected workflow env names, tests, scripts, and documented local E2E references.
- Confirmed backup coverage already includes `CREATION_RECOVERY_STORAGE_KEY` and `CREATION_ACTIVITY_STORAGE_KEY`.
- Found `useCreationRecovery` did not catch localStorage write failures while `useCreationActivity` already did.
- Added regression coverage for storage write failures.
- Wrapped recovery persistence in try/catch while preserving in-memory records.

### Verified
- RED: `npm test -- src/hooks/useCreationRecovery.test.ts` failed with `Error: quota exceeded`.
- GREEN: `npm test -- src/hooks/useCreationRecovery.test.ts` — 1 file, 4 tests passed.
- Full local gate passed: `npm test` — 67 files, 451 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`.

### CI status
- Commit `4999238` passed GitHub Actions run `28305235315`.

---

## Long Campaign 026 — Stage 6 Empty Filter Reset Final Improve (2026-06-28)

### Goal
- Give users a direct way back to all pending work when a specific Creation Center filter is empty.

### Completed
- Added an actionable empty filtered state.
- Added `显示全部待处理记录` reset behavior that returns the task filter to `全部`.
- Styled the empty state as a small action panel.

### Verified
- RED: `npm test -- src/components/RecoveryCenter.test.tsx` failed before the reset action existed.
- GREEN: `npm test -- src/components/RecoveryCenter.test.tsx` — 1 file, 12 tests passed.
- Final full local gate passed: `npm test` — 67 files, 452 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Final authenticated local Pages browser smoke passed via `npm run smoke:auth-export` against `http://127.0.0.1:8796`.

### CI and live status
- Commit `58f33b2` passed GitHub Actions run `28305383699`.
- Cloudflare production deployment `7e14e761-6106-431d-8bd8-44c10c415d6b` points to source `58f33b2`.
- Latest direct Pages URL, stable Pages domain, and custom domain returned HTTP 200 for the app shell and `/api/session`.

### Campaign status
- Long Campaign 026 completed all six required stages with local validation, authenticated browser smoke, commits, pushes, GitHub Actions verification, and live smoke.

---

## Long Campaign 027 — Stage 1 Service Readiness Center (2026-06-28)

### Goal
- Give authenticated users one trustworthy place to verify whether core storage, security, and generation configuration are ready before starting work.

### Completed
- Added a shared readiness snapshot builder for `database`, `media`, `generation`, and `security` checks.
- Added authenticated `GET /api/readiness` with safe D1, R2, secret-presence, and upstream-key-configuration checks.
- Added a Settings `服务就绪中心` panel with loading, degraded, error, refresh, timestamp, and per-check detail states.
- Kept generation status honest: configured credentials are reported separately from real upstream availability.

### Verified
- RED: `npx vitest run functions/_shared/readiness.test.ts src/components/ServiceReadinessPanel.test.tsx` failed before the readiness module and panel existed.
- GREEN: `npx vitest run functions/_shared/readiness.test.ts src/components/ServiceReadinessPanel.test.tsx` — 2 files, 4 tests passed.
- Local Pages API smoke passed with temporary local D1/R2 bindings: unauthenticated `/api/readiness` returned 401, authenticated E2E session returned the four expected readiness checks.
- Full local gate passed: `npm test` — Node smoke 4 tests plus Vitest 69 files, 456 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI status
- Commit `d3ba5a6` passed GitHub Actions run `28307175247`.
- Production smoke resolved exact deployment `https://d271bf06.cstd-design.pages.dev` for source `d3ba5a6c889d02652663f8adf38c37150a9c7b1b`.
- Exact deployment `/api/readiness` returned HTTP 401 without a session.

---

## Long Campaign 027 — Stage 2 Creation Preflight Guidance (2026-06-28)

### Goal
- Surface service-readiness preflight guidance directly inside creation workspaces before users start consultation, image, or video work.

### Completed
- Added `useServiceReadiness(authenticated)` to load authenticated readiness once and refresh it manually while preserving stale status during refresh.
- Added `CreationPreflightNotice` with loading, degraded, and retryable-error states.
- Added non-blocking preflight guidance to Chat, Image, and Video workspaces.
- Passed the shared readiness state from `App` into all three creation workspaces.

### Verified
- RED: `npx vitest run src/components/CreationPreflightNotice.test.tsx src/hooks/useServiceReadiness.test.ts src/components/CreationRecoveryLifecycle.test.tsx` failed before the hook/component and workspace integration existed.
- GREEN: same command — 3 files, 10 tests passed.
- Full local gate passed: `npm test` — Node smoke 4 tests plus Vitest 71 files, 462 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Authenticated local Pages browser smoke passed against `http://127.0.0.1:8801` with Chrome, test session fixture, export dialog, copy verification, console/runtime checks, and no horizontal overflow.

### CI status
- Commit `4c7365e` passed GitHub Actions run `28311467893`.
- Production smoke resolved exact deployment `https://37164b5a.cstd-design.pages.dev` for source `4c7365e37d9009ca1e58ab8b7c21f0b8eb6a7a39`.
- Exact deployment passed anonymous session, protected API boundary, and disabled E2E-bypass checks.

---

## Long Campaign 027 — Stage 3 Preflight Notice UIUX (2026-06-28)

### Goal
- Make creation-workspace preflight warnings clearer, more accessible, and more reliable on mobile.

### Completed
- Added workspace-specific accessible names for chat, image, and video preflight notices.
- Added a visible preflight title and compact status badge for degraded service state.
- Added an accessible list label for affected services and workspace-specific refresh button labels.
- Tightened mobile layout so long refresh actions can wrap without horizontal overflow.

### Verified
- RED: `npx vitest run src/components/CreationPreflightNotice.test.tsx` failed before the workspace-specific labels, title, badge, and list name existed.
- GREEN: `npx vitest run src/components/CreationPreflightNotice.test.tsx src/components/CreationRecoveryLifecycle.test.tsx` — 2 files, 8 tests passed.
- Full local gate passed: `npm test` — Node smoke 4 tests plus Vitest 71 files, 462 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Mobile Pages browser verification passed against `http://127.0.0.1:8802` at `390x844` with authenticated session, intentionally degraded readiness, image-workspace preflight notice, no console warnings/errors, and no horizontal overflow.

### CI status
- Commit `c00b62f` passed GitHub Actions run `28311747575`.
- Production smoke resolved exact deployment `https://544cd376.cstd-design.pages.dev` for source `c00b62febf16c502cc8367f2c9152a1f43e8224d`.

---

## Long Campaign 027 — Stage 4 Safe Readiness Diagnostics (2026-06-28)

### Goal
- Let users copy an actionable service-readiness diagnostic summary for support handoff without exposing secret values.

### Completed
- Added a readiness diagnostic formatter with secret-assignment and token-shape redaction.
- Added a Settings copy action with clipboard failure handling and accessible feedback.
- Added responsive action styling and isolated the formatter from the React component module.

### Verified
- RED: `npx vitest run src/components/ServiceReadinessPanel.test.tsx` failed before the formatter and copy action existed.
- GREEN: same command — 1 file, 4 tests passed.
- Full local gate passed: `npm test` — Node smoke 4 tests plus Vitest 71 files, 464 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.
- Authenticated local Pages browser verification passed at `http://127.0.0.1:8803`: copy and clipboard content checks passed, no sensitive pattern was found, no overflow occurred, and the console reported 0 errors / 0 warnings.

### CI status
- Commit `68b996f` passed GitHub Actions run `28312908215`.
- Production smoke resolved exact deployment `https://d1cb5381.cstd-design.pages.dev` for source `68b996f9c73a31dbe735cecafb10560ee569ecdd`.

---

## Long Campaign 027 — Inserted CI Fix: Pages Functions Propagation (2026-06-28)

- Record commit `a364128` reached deployment, but run `28312955315` saw a transient Cloudflare 404 from `/api/session` before Pages Functions propagation completed.
- Added a RED/GREEN Node regression for 404-then-200 propagation and changed smoke polling to wait for each endpoint's expected status.
- Full local gate passed: Node smoke 5 tests, Vitest 71 files / 464 tests, Functions typecheck, lint, build, high-level audit, and diff check.
- Commit `eb71e83` passed GitHub Actions run `28313108659`.
- Production smoke resolved exact deployment `https://2adf3499.cstd-design.pages.dev` for source `eb71e83142508ec6a90f01895c53b907e1ca02b9`.

---

## Long Campaign 027 — Stage 5 Provider Runtime Safety CHECK (2026-06-28)

### Goal
- Audit readiness/provider failure modes, Cloudflare Workers runtime safety, CI reliability, dependency drift, and regression coverage before the final increment.

### Completed
- Confirmed readiness health messages remain fixed and do not expose implementation exceptions.
- Added a provider-client regression test proving large upstream error responses must not be read through full `Response.text()`.
- Replaced full provider error-body reads with a bounded stream reader capped at 2048 bytes, canceling the remainder before safe error normalization.
- Updated `@cloudflare/workers-types` to `4.20260628.1`.

### Verified
- RED: `npx vitest run functions/_shared/core.test.ts` failed because the previous implementation called full `Response.text()`.
- GREEN: same command — 1 file, 22 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files / 465 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI status
- Commit `835890e` passed GitHub Actions run `28313963197`.
- Production smoke resolved exact deployment `https://b7e439d4.cstd-design.pages.dev` for source `835890e0b94864ba78432abe1497aeded125f7f0`.

---

## Long Campaign 027 — Stage 6 Generated Asset Size Guard (2026-06-28)

### Goal
- Add a final runtime guard for generated remote assets before they are written into R2.

### Completed
- Added `guardRemoteAssetResponse` to reject oversized declared remote assets and wrap remote streams with a 100 MB byte-counting limit.
- Applied the guard to generated image downloads and completed video downloads before R2 writes.
- Added a clear user-facing error for oversized generated results.

### Verified
- RED: `npx vitest run functions/_shared/core.test.ts` failed before the remote asset guard existed.
- GREEN: same command — 1 file, 23 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files / 466 tests; `npm run typecheck:functions`; `npm run lint`; `npm run build`; `npm audit --audit-level=high`; `git diff --check`.

### CI status
- Commit `432627c` passed GitHub Actions run `28314106427`.
- Production smoke resolved exact deployment `https://c135e541.cstd-design.pages.dev` for source `432627c453ce19da681222e91ffe4b00b74ead97`.
- Long Campaign 027 completed: all 6 required stages are implemented, tested locally, pushed, CI-verified, and live-smoke verified.

---

## Long Campaign 028 — Stage 1 Recovery Risk Summary (2026-06-28)

### Goal
- Turn Creation Center pending work from a flat list into a prioritized recovery-risk summary.

### Completed
- Added total pending, stale saved-work, and highest-risk workspace cards.
- Added a one-click action that opens the highest-risk workspace filter.
- Added responsive desktop and mobile layouts for the new summary.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before the risk-summary region existed.
- GREEN: same command — 1 file, 13 tests passed.
- Full local gate passed: `npm test` — Node smoke 5 tests plus Vitest 71 files / 467 tests; Functions typecheck; lint; build; high-level audit; diff check.
- Authenticated local Pages browser verification passed at `http://127.0.0.1:8804` on desktop and mobile, including risk counts, workspace filtering, overflow, console, and runtime checks.

### CI status
- Commit `bc1611e` passed GitHub Actions run `28320690212`.
- Production smoke resolved exact deployment `https://76132ef8.cstd-design.pages.dev` for source `bc1611e5cb11c66b2331e4b607d73c831923a1ba`.

---

## Long Campaign 028 — Stage 2 Stale Recovery Queue (2026-06-28)

### Goal
- Turn the stale-recovery risk metric into an actionable queue without mixing in active or recently saved work.

### Completed
- Added a stale-only pending-work filter for records saved at least 24 hours ago.
- Added direct navigation from the stale-risk card with a distinct accessible name from the filter chip.
- Kept active tasks, recent history, and fresh records outside the stale queue and retained scoped cleanup semantics.
- Expanded the desktop filter grid for the fifth filter while preserving the mobile layout.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before the stale-risk action existed.
- GREEN: same command — 1 file, 14 tests passed.
- Full local gate passed: Node smoke 5 tests, Vitest 71 files / 468 tests, Functions typecheck, lint, build, high-level audit, and diff check.
- Authenticated local Pages browser verification passed at `http://127.0.0.1:8805` on desktop and mobile, including stale/fresh/active separation, status announcement, overflow, console, and runtime checks.

### CI status
- Commit `16607e3` passed GitHub Actions run `28321023007`.
- Production smoke resolved exact deployment `https://5fa43a3c.cstd-design.pages.dev` for source `16607e353d5b27db151d5e55b72882a0a4df266a`.

### Next
- Continue Stage 3 UIUX by making stale recovery records easier to scan visually and accessibly inside the Creation Center queue.

---

## Long Campaign 028 — Stage 3 Stale Recovery Item Cues (2026-06-28)

### Goal
- Make stale recovery records visually and accessibly scannable inside the Creation Center pending queue.

### Completed
- Added a visible `保存较久` badge and “超过 24 小时未处理” hint to stale recovery records.
- Added accessible listitem labels that distinguish stale recovery records from fresh records.
- Added a warm stale-card treatment without changing fresh record behavior.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before stale recovery listitems had record-level accessible labels and stale cues.
- GREEN: same command — 1 file, 15 tests passed.
- Full local gate passed: Node smoke 5 tests, Vitest 71 files / 469 tests, Functions typecheck, lint, build, high-level audit, and diff check.
- Authenticated local Pages browser verification passed at `http://127.0.0.1:8806` on desktop and mobile, including stale/fresh visual separation, stale-only filter, overflow, console, and runtime checks.

### CI status
- Commit `52b4b8f` passed GitHub Actions run `28321448619`.
- Production smoke resolved exact deployment `https://4b72a788.cstd-design.pages.dev` for source `52b4b8f0ee050b66e3f441b5733cdc8de0a6cb9e`.

### Next
- Continue Stage 4 IMPROVE with a stronger stale-recovery bulk handling increment.

---

## Long Campaign 028 — Stage 4 Oldest-First Stale Recovery (2026-06-29)

### Goal
- Turn the stale recovery queue into an oldest-first action path.

### Completed
- Sorted the stale-only queue by oldest saved recovery record first.
- Added a `保存较久优先处理` panel that highlights the oldest stale record.
- Added a direct action to open the oldest stale record and close Creation Center.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before stale records were sorted oldest-first and before the priority panel existed.
- GREEN: same command — 1 file, 16 tests passed.
- Full local gate passed: Node smoke 5 tests, Vitest 71 files / 470 tests, Functions typecheck, lint, build, high-level audit, and diff check.
- Authenticated local Pages browser verification passed at `http://127.0.0.1:8807` on desktop and mobile, including oldest-first sorting, priority action, restored video prompt, overflow, console, and runtime checks.

### CI status
- Commit `4260d24` passed GitHub Actions run `28363376152`.
- Production smoke resolved exact deployment `https://6f6d7396.cstd-design.pages.dev` for source `4260d248d1b50c478e94c76b587d63d61736e11b`.

### Next
- Continue Stage 5 CHECK by auditing stale recovery date handling, invalid timestamps, clear actions, and release gates.

---

## Long Campaign 028 — Stage 5 Recovery Timestamp Guard (2026-06-29)

### Goal
- Audit recovery storage safety and prevent invalid timestamp records from reaching Creation Center.

### Completed
- Found and fixed invalid `createdAt` records loading into the user-visible recovery queue.
- Tightened stored recovery validation to require finite parsed timestamps.
- Hardened ordering/trimming to filter invalid timestamps before sorting and persistence.

### Verified
- RED: `npx vitest run src/hooks/useCreationRecovery.test.ts` failed before invalid timestamp records were rejected.
- GREEN: same command — 1 file, 5 tests passed.
- Full local gate passed: Node smoke 5 tests, Vitest 71 files / 471 tests, Functions typecheck, lint, build, high-level audit, and diff check.
- Authenticated local Pages browser verification passed at `http://127.0.0.1:8808` on desktop and mobile, including invalid-record filtering, valid-record visibility, trigger count, overflow, console, and runtime checks.

### CI status
- Commit `0218200` passed GitHub Actions run `28363902766`.
- Production smoke resolved exact deployment `https://06599af3.cstd-design.pages.dev` for source `0218200893f819f0f42784f7d8a6305d5c3e476b`.

### Next
- Continue Stage 6 final IMPROVE with one final recovery-center completion affordance and final verification.

---

## Long Campaign 028 — Stage 6 Stale Recovery Cleanup Progression (2026-06-29)

### Goal
- Complete the oldest-first stale recovery path with direct cleanup and visible remaining-work progress.

### Completed
- Added a progress line showing the number of stale recoveries remaining.
- Added a direct action to ignore the oldest stale recovery from the priority panel.
- Kept the queue open and automatically advanced the next-oldest record after cleanup.
- Added responsive wrapping for the priority actions.

### Verified
- RED: `npx vitest run src/components/RecoveryCenter.test.tsx` failed before the progress text and direct oldest-record ignore action existed.
- GREEN: same command — 1 file, 16 tests passed.
- Full local gate passed: Node smoke 5 tests, Vitest 71 files / 471 tests, Functions typecheck, lint, build, high-level audit, and diff check.
- Authenticated local Pages browser verification passed at `http://127.0.0.1:8809` on desktop and mobile, including oldest-only removal, immediate next-oldest progression, count update from 2 to 1, fresh-record preservation, overflow, console, and runtime checks.

### CI status
- Commit `e7e04a8` passed GitHub Actions run `28364706741`.
- Production smoke resolved exact deployment `https://6ae8e16a.cstd-design.pages.dev` for source `e7e04a87f9410f7fe7f2413ae8c980a54a4583ea`.

### Final status
- All six Campaign 028 stages are complete, tested, pushed, CI-verified, and live-smoke verified.
