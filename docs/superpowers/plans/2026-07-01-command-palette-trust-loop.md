# Command Palette Trust Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make command discovery, keyboard navigation, recent actions, storage recovery, and accessibility reliable in the existing command palette.

**Architecture:** Keep command definitions in `App.tsx` and encapsulate all palette-specific ranking, selection, persistence, and focus behavior in `CommandPalette.tsx`. Persist only bounded command ids under a registered storage key so backup/restore remains complete.

**Tech Stack:** React 19, TypeScript 6, Vitest, Testing Library, Vite 8, Playwright browser QA.

---

### Task 1: Search every discoverability field

**Files:**
- Create: `src/components/CommandPalette.test.tsx`
- Modify: `src/components/CommandPalette.tsx`

- [ ] Render a command whose English alias does not occur in its Chinese label or description, enter `settings`, and assert that `偏好设置` remains available.
- [ ] Run `npx vitest run src/components/CommandPalette.test.tsx`; expect RED because `scoreItem` currently returns before checking aliases.
- [ ] Score label, description, and each keyword independently, weighting label matches above description and keyword matches.
- [ ] Re-run the targeted test; expect GREEN.
- [ ] Run the full local gate, update both `.agent` logs, stage exact files, commit `fix: search command aliases`, push `main`, verify CI, and smoke the exact deployment.

### Task 2: Keep keyboard selection valid

**Files:**
- Modify: `src/components/CommandPalette.test.tsx`
- Modify: `src/components/CommandPalette.tsx`

- [ ] Add a test that moves selection down, narrows the query to one different command, presses Enter, and expects that sole command to run.
- [ ] Run the targeted test; expect RED because the old index remains outside the filtered list.
- [ ] Reset selection when the query or opening changes, clamp against result changes, and scroll the active option into view.
- [ ] Re-run targeted and full gates, update logs, commit `fix: stabilize command keyboard selection`, push, verify CI, and smoke the exact deployment.

### Task 3: Add visible result and position feedback

**Files:**
- Modify: `src/components/CommandPalette.test.tsx`
- Modify: `src/components/CommandPalette.tsx`
- Modify: `src/App.css`

- [ ] Add a test expecting `共 2 个命令` and `当前 1/2`, then ArrowDown and expect `当前 2/2`.
- [ ] Run the targeted test; expect RED because no result summary exists.
- [ ] Add a compact live summary between search and list, with an empty-result count and mobile-safe styling.
- [ ] Run targeted/full gates and desktop/mobile browser QA, update logs, commit `uiux: clarify command search position`, push, verify CI, and smoke the exact deployment.

### Task 4: Surface recent successful commands

**Files:**
- Modify: `src/components/CommandPalette.test.tsx`
- Modify: `src/components/CommandPalette.tsx`
- Modify: `src/storage-keys.ts`

- [ ] Add a test that executes a command, reopens the palette, and expects it once under `最近使用` ahead of normal groups.
- [ ] Run the targeted test; expect RED because execution history is not stored.
- [ ] Add a bounded recent-id list, one execution wrapper for click/Enter, a recent group for empty queries, and backup-key registration.
- [ ] Run targeted/full gates and browser QA, update logs, commit `feat: remember recent commands`, push, verify CI, and smoke the exact deployment.

### Task 5: Harden malformed and stale recent history

**Files:**
- Modify: `src/components/CommandPalette.test.tsx`
- Modify: `src/components/CommandPalette.tsx`

- [ ] Add tests for malformed JSON, non-string entries, duplicates, and removed command ids.
- [ ] Run the targeted tests; expect RED against the initial history parser.
- [ ] Normalize history to unique known string ids, cap its length, and persist pruning without throwing when storage is unavailable.
- [ ] Run targeted/full security and repository gates, update logs, commit `fix: validate command history`, push, verify CI, and smoke the exact deployment.

### Task 6: Complete the combobox and focus contract

**Files:**
- Modify: `src/components/CommandPalette.test.tsx`
- Modify: `src/components/CommandPalette.tsx`

- [ ] Add tests for combobox/listbox linkage, active-descendant updates, query reset on reopen, and focus restoration after close.
- [ ] Run the targeted tests; expect RED because ids, active-descendant, and restoration are absent.
- [ ] Add stable option/list ids, combobox attributes, clear transient query state on close, and restore the prior focus target.
- [ ] Run targeted/full gates and desktop/mobile keyboard browser QA, update logs, commit `feat: complete command palette accessibility`, push, verify CI, and smoke the exact deployment.

## Self-review

- Every design requirement maps to one task and each task can ship independently.
- No new runtime dependency or unrelated refactor is required.
- Storage contains ids only, is bounded, and is registered for backup.
- Every behavior change has an explicit RED/GREEN command and release closure.
