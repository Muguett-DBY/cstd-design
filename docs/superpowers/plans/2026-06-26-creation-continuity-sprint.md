# Creation Continuity Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the creation center into a continuation hub and consolidate mobile navigation into one polished control.

**Architecture:** A pure model helper derives recent creation highlights from existing app data. `RecoveryCenter` renders the resulting actions and delegates navigation through callbacks. The UI/UX stage removes duplicate app-shell navigation and upgrades the existing `MobileBottomNav` without changing business APIs.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, Cloudflare Pages

---

### Task 1: Derive recent creation highlights

**Files:**
- Create: `src/creation-center-model.ts`
- Create: `src/creation-center-model.test.ts`

- [ ] Write tests proving conversations and generated images are sorted by valid timestamps and failed video history is excluded from completed counts.
- [ ] Run `npx vitest run src/creation-center-model.test.ts` and confirm failure because the helper does not exist.
- [ ] Implement typed, non-mutating selectors with invalid dates treated as oldest.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Add continuation actions and preserve recovery records

**Files:**
- Modify: `src/components/RecoveryCenter.test.tsx`
- Modify: `src/components/RecoveryCenter.tsx`
- Modify: `src/App.tsx`

- [ ] Add a failing component test for latest-conversation, latest-image, and video-workspace actions.
- [ ] Run the focused component test and confirm the continuation controls are absent.
- [ ] Add the controls, callbacks, fallback labels, and completed-video filtering.
- [ ] Wire the model into `App` and stop dismissing a recovery record merely because it was opened.
- [ ] Re-run focused tests and the full local gate.

### Task 3: Commit and release the IMPROVE stage

**Files:**
- Modify: `.agent/iteration-log.md`
- Modify: `.agent/orchestrator-log.md`

- [ ] Review status, unstaged diff, staged diff, debug statements, and sensitive patterns.
- [ ] Commit only stage files with `feat: add creation continuation shortcuts`.
- [ ] Push `main`, watch GitHub Actions, and record the result.

### Task 4: Consolidate and polish mobile navigation

**Files:**
- Create: `src/components/MobileBottomNav.test.tsx`
- Modify: `src/components/MobileBottomNav.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] Add a failing test for explicit accessible workspace labels and selected-state semantics.
- [ ] Run the focused test and confirm the new semantics are absent.
- [ ] Remove the legacy duplicate mobile navigation from `App`.
- [ ] Upgrade the remaining nav with safe-area spacing, fixed positioning, focus/active feedback, and compact labels.
- [ ] Adjust mobile creation-center geometry so it clears the single navigation.
- [ ] Run focused and full local gates.

### Task 5: Browser QA and release the UI/UX stage

**Files:**
- Modify: `.agent/iteration-log.md`
- Modify: `.agent/orchestrator-log.md`

- [ ] Build and serve with `wrangler pages dev dist`.
- [ ] Verify desktop and 390x844 mobile layouts, continuation controls, single mobile navigation, keyboard/focus behavior, and console errors.
- [ ] Review status, diffs, debug statements, and sensitive patterns.
- [ ] Commit only stage files with `style: consolidate mobile creation navigation`.
- [ ] Push `main`, watch GitHub Actions, smoke-test the deployed Pages URLs, and record the result.
