# Orchestrator Log

## Campaign 016 — Reliable creation loop (2026-06-26)

- Sequence: IMPROVE → IMPROVE → UIUX → IMPROVE → CHECK → IMPROVE
- Protected existing untracked file: `.agent/orchestrator-history/campaign-014/state.json`
- Previous flagship carried forward: integration coverage for chat, image, and video critical flows
- Current progress: chat and image recovery now share an accessible, responsive status surface; video task states use the same vocabulary
- Verification: 381 tests, functions typecheck, zero-warning lint, production build, live page identity and console check
- Next: durable video recipes and retry

## Campaign 002 — Started 2026-06-19T09:45:00Z

**Theme**: Video workspace maturity, accessibility, and test coverage

**Previous Campaign**: Campaign 001 completed - D1 persistence, upload improvements, code splitting
**Avoiding**: Visual polish, D1 migration (already done), file storage improvements

**Main Product Directions**:
1. Video/image workspace maturity (polling, regeneration, metadata)
2. Accessibility (WCAG compliance, keyboard nav, ARIA)
3. Test coverage expansion
4. Network resilience
5. User productivity (templates, saved searches)

### Phase 1/18 — IMPROVE: Video workspace polling UI improvements

**Status**: DONE
**Commit**: `e558cbf`
**CI**: Passed (run `27818515008`)

**Completed**:
- Added elapsed time tracking during video generation
- Added Timer icon and formatElapsed helper function
- Added task-elapsed CSS class with chip-like styling
- Shows live "已用时 X分Y秒" during in_progress and queued states

### Phase 2/18 — IMPROVE: Lightbox keyboard navigation

**Status**: DONE
**Commit**: `5e712bc`
**CI**: Passed (run `27818678008`)

**Completed**:
- Added Home/End key support for first/last asset
- Added Tab/Shift+Tab focus trap
- Added auto-focus on lightbox mount
- Added aria-live="polite" to counter
- Improved aria-label with position info

### Phase 3/18 — UIUX: Image/video result card consistency

**Status**: DONE
**Commit**: `af15834`
**CI**: Passed (run `27818905643`)

**Completed**:
- Created unified `ResultCard` component
- Updated `ImageWorkspace` to use ResultCard
- Added consistent CSS for result card layout
- Supports image and video types with shared header/metadata/actions

### Phase 4/18 — IMPROVE: Asset metadata extraction (dimensions, duration)

**Status**: DONE
**Commit**: `7207437`
**CI**: Passed (run `27819233914`)

**Completed**:
- Added width, height, duration fields to AssetItem type
- Created asset-metadata utility functions (extractImageDimensions, extractVideoDuration)
- Created useAssetMetadata React hook for client-side metadata extraction
- Created AssetMeta component to display dimensions/duration in asset cards
- Added CSS for asset-meta-details

### Phase 5/18 — CHECK: Accessibility audit (WCAG compliance)

**Status**: DONE
**Commit**: `fca4c90`
**CI**: Passed (run `27819690963`)

**Completed**:
- Added role=dialog, aria-modal, aria-labelledby to ExportModal and ConversationPickerModal
- Added Escape key handlers and body scroll lock to both modals
- Added focus management (auto-focus on open)
- Fixed ResultCard keyboard handler (Enter/Space to preview)
- Improved task status badge color contrast for AA compliance (darker text, stronger backgrounds)

### Phase 6/18 — IMPROVE: Onboarding tour for new users

**Status**: DONE
**Commit**: `c7ae7cb`
**CI**: Passed (run `27820008373`)

**Completed**:
- Created OnboardingTour component with 5-step guided introduction
- Uses localStorage to track completion (one-time show)
- Supports keyboard nav (Escape, ArrowRight)
- Dot navigation indicator with active state animation
- Skip option for users who don't want the tour

**CYCLE 1 COMPLETE (Phases 1-6)**: Video polling, lightbox keyboard, result card consistency, asset metadata, accessibility fixes, onboarding tour

### Phase 7/18 — IMPROVE: Video progress persistence across tab switches

**Status**: DONE
**Commit**: `1412ad7`
**CI**: Passed (run `27820493484`)

**Completed**:
- Added useVideoTaskPersistence hook with localStorage persistence
- Video task state now survives tab switches and page refresh
- Auto-clears on completion or failure
- ClearScope now also clears video task

### Phase 8/18 — IMPROVE: Image regeneration with style reference

**Status**: DONE
**Commit**: `c30d380`
**CI**: Passed (run `27820671117`)

**Completed**:
- Added onRegenerate prop to ResultCard
- Added "以此为参考重新生成" button with RefreshCw icon
- ImageWorkspace sets the last result as reference and pre-fills prompt for regeneration
- Added result-card-actions CSS for consistent action layout

### Phase 9/18 — UIUX: Accessibility improvements (ARIA, keyboard nav)

**Status**: DONE
**Commit**: `d978efe`
**CI**: Passed (run `27820882565`)

**Completed**:
- Added aria-pressed to folder chips, sort options, filter options
- Added role=radio and aria-checked to Segmented and style chips
- Added role=radiogroup to segmented containers
- Added aria-label to folder delete span (was a non-interactive span)

### Phase 10/18 — IMPROVE: Test coverage expansion

**Status**: DONE
**Commit**: `9e28706`
**CI**: Passed (run `27821165245`)

**Completed**:
- Added 12 tests for asset-metadata utilities (formatDimensions, formatDuration, getAssetMetadata)
- Added 6 tests for useVideoTaskPersistence hook
- Added 4 tests for Segmented component
- Total tests: 49 (up from 27)

### Phase 11/18 — CHECK: Performance audit

**Status**: DONE
**Commit**: `6318898`
**CI**: Passed (run `27821324805`)

**Completed**:
- Verified all setInterval calls have proper cleanup
- No memory leaks detected
- All tests, lint, typecheck, build pass
- Performance baseline is solid (49 tests, clean build)

### Phase 12/18 — IMPROVE: Network resilience improvements

**Status**: DONE
**Commit**: `acceebd`
**CI**: Passed (run `27821712078`)

**Completed**:
- Added automatic retry with exponential backoff (800ms, 1600ms)
- Retries on network failures, 5xx, 408, 429
- 401 and 4xx (other than 408/429) fail immediately
- Same error messages, no breaking changes

### Phase 13/18 — IMPROVE: Conversation templates and reusable prompts

**Status**: DONE
**Commit**: `a131c56`
**CI**: Passed (run `27821967961`)

**Completed**:
- Created `useChatPromptTemplates` hook with localStorage persistence
- Integrated template actions (save, toggle list, click-to-fill) in ChatWorkspace composer
- 3 seed templates: 总结文本、翻译为中文、头脑风暴
- Mirrors ImageWorkspace pattern for consistency

### Phase 14/18 — UIUX: Lightbox and asset grid polish

**Status**: DONE
**Commit**: `84bc4b5`
**CI**: Passed (run `27822159044`)

**Completed**:
- Added image scale-on-hover (1.05x, 0.35s ease)
- Added view hint Eye icon in corner of image previews
- Improved lightbox button scale hover + active feedback
- Better visual hierarchy and depth

### Phase 15/18 — IMPROVE: Search filters and saved searches

**Status**: DONE
**Commit**: `83b7907`
**CI**: Passed (run `27822411430`)

**Completed**:
- Added useMessageSearch role/date filters (RoleFilter, DateFilter)
- Created useSavedSearches hook (max 20 saved, localStorage)
- Filter dropdown UI in MessageSearchBar with pills
- Saved searches dropdown shows on input focus
- Click saved search to apply query + filters
- 49 tests pass, TypeScript clean, ESLint 0 warnings

### Phase 16/18 — IMPROVE: Lightbox and asset grid improvements

**Status**: DONE
**Commit**: `31f5aa5`
**CI**: Passed (run `27822742351`)

**Completed**:
- Image zoom (50-400% via +/-/0 keys and buttons)
- Fullscreen toggle (browser fullscreen API)
- Info panel with metadata (filename, kind, size, dimensions, duration, MIME)
- Per-asset zoom persistence (state by index)
- New keyboard shortcuts: + - 0 I
- 49 tests pass, TypeScript clean, ESLint 0 warnings

### Phase 17/18 — CHECK: Final cleanup and code quality

**Status**: DONE

**Completed**:
- All 49 tests pass across 9 test files
- TypeScript clean, ESLint 0 warnings
- No unused locals/params (`tsc --noUnusedLocals --noUnusedParameters` clean)
- Bundle 582KB (essentially same as 575KB baseline +7KB for 18 phases of features)
- No dead code, no dead imports

### Phase 18/18 — IMPROVE: Campaign wrap-up and final polish

**Status**: RUNNING
**Started**: 2026-06-19T11:28:00Z

**Plan**:
- Update .agent/iteration-log.md with campaign 002 summary
- Archive campaign 002 to .agent/orchestrator-history/campaign-002/
- Final commit

**Verification**: lint, typecheck, tests, build, CI

---

## Campaign 016 — Reliable Creation Loop (2026-06-26)

**Status**: RUNNING
**Branch**: `main`

**Completed so far**:
- `fc23870` — Design and implementation plan committed, pushed, and GitHub Actions run `28187406899` passed.
- `f475d21` — Recoverable chat sending committed, pushed, and GitHub Actions run `28187619080` passed.
- `ba2fa0c` — Recoverable image batch retries committed, pushed, and GitHub Actions run `28187846107` passed.
- `f0fe0e9` — Shared creation status UX committed, pushed, and GitHub Actions run `28188153586` passed.
- `d312685` — Durable video recipes committed, pushed, and GitHub Actions run `28188674650` passed.

**Current increment**: Cross-workspace recovery center. The app now stores bounded recovery records for chat, image, and video failures, exposes a floating recovery center, and injects selected payloads back into the matching workspace by remounting with initial recovery state.

**Verification before commit**:
- `npx vitest run src/hooks/useCreationRecovery.test.ts src/components/RecoveryCenter.test.tsx` — 5 tests passed.
- `npm test` — 55 files and 387 tests passed.
- `npm run typecheck:functions` — passed.
- `npm run lint` — passed with `--max-warnings=0`.
- `npm run build` — passed.
- `git diff --check` — passed; line-ending normalization warnings only.

**Guardrails**:
- Keep working on `main`.
- Do not touch the existing untracked `.agent/orchestrator-history/campaign-014/state.json`.
- Commit, push, and watch Actions after each validated increment.
