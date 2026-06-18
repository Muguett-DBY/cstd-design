# Durable Thread Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist message threads in D1 and add a complete Thread Center workflow for reviewing and managing replies.

**Architecture:** Authenticated nested conversation endpoints own thread listing, creation, and clearing; an ID endpoint owns update and deletion. A conversation-scoped React hook coordinates server state, while focused components render inline replies and the right-panel overview.

**Tech Stack:** React 19, TypeScript 6, Cloudflare Pages Functions, D1, Zod, Vitest, Testing Library.

---

### Task 1: Define thread contracts test-first

**Files:**
- Modify: `src/types.ts`
- Modify: `functions/_shared/validation.ts`
- Modify: `functions/_shared/core.test.ts`
- Create: `src/thread-state.ts`
- Create: `src/thread-state.test.ts`

- [ ] Add failing tests proving blank/oversized replies are rejected and valid create/update payloads are trimmed.
- [ ] Add failing tests proving replies group by parent message in stable chronological order and ignore messages outside the active conversation.
- [ ] Run `npm test -- functions/_shared/core.test.ts src/thread-state.test.ts` and confirm the new assertions fail for missing contracts.
- [ ] Add `ThreadReply`, Zod schemas, and pure grouping helpers.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Add durable D1 storage and authenticated APIs

**Files:**
- Create: `migrations/0007_message_threads.sql`
- Modify: `functions/_shared/http.ts`
- Create: `functions/_shared/threads.ts`
- Create: `functions/api/conversations/[id]/threads.ts`
- Create: `functions/api/threads/[id].ts`
- Modify: `functions/_shared/clear.ts`

- [ ] Add the table and indexes in migration and runtime schema bootstrap.
- [ ] Implement list/create/clear database functions that verify the conversation and parent message relationship.
- [ ] Implement update/delete functions scoped to non-deleted conversations.
- [ ] Add authenticated handlers with validation and useful 400/404 responses.
- [ ] Delete thread rows during chat/all clearing before deleting parent records.
- [ ] Run `npm run typecheck:functions`.

### Task 3: Replace local storage with a resilient API hook

**Files:**
- Modify: `src/api.ts`
- Rewrite: `src/hooks/useMessageThreading.ts`
- Create: `src/hooks/useMessageThreading.test.ts`

- [ ] Add a failing hook test for conversation-scoped loading and stale response protection.
- [ ] Add API methods for list/create/update/delete/clear.
- [ ] Implement the hook with loading, mutation state, error propagation, stable IDs, and post-confirmation state updates.
- [ ] Re-run focused hook tests.

### Task 4: Build inline thread management and Thread Center

**Files:**
- Create: `src/components/MessageThread.tsx`
- Create: `src/components/ThreadCenter.tsx`
- Modify: `src/components/ChatWorkspace.tsx`
- Modify: `src/components/index.ts`
- Modify: `src/App.css`

- [ ] Extract inline reply rendering into `MessageThread`.
- [ ] Add edit, delete, clear, timestamp, loading, and empty/error states.
- [ ] Add `ThreadCenter` to the right panel with parent snippets, reply counts, latest activity, and jump/expand behavior.
- [ ] Ensure switching conversations resets transient reply/edit state.
- [ ] Add responsive styles and accessible labels/focus behavior.
- [ ] Run frontend tests and lint.

### Task 5: Documentation, verification, review, and delivery

**Files:**
- Modify: `.agent/iteration-log.md`
- Modify: `README.md`

- [ ] Update product documentation and the iteration handoff.
- [ ] Run `npm test`, `npm run typecheck:functions`, `npm run lint`, and `npm run build`.
- [ ] Run browser QA on desktop and mobile.
- [ ] Review `git diff`, scan for secrets/debug code, and keep the pre-existing `AssetWorkspace.tsx` change unstaged.
- [ ] Commit the iteration, push `main`, watch the GitHub Actions run, and repair any actionable CI failure until green.
