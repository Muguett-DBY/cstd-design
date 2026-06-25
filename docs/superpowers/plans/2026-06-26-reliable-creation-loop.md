# Reliable Creation Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make chat, image, and video creation recoverable after failures or refreshes, add a cross-workspace recovery center, and protect the workflows with integration tests.

**Architecture:** Introduce focused recovery state and presentation modules, then integrate them into the existing workspaces without changing backend contracts. Store a bounded, versioned registry of non-sensitive recovery records in localStorage and keep workspace-specific recipe data typed.

**Tech Stack:** React 19, TypeScript 6, Vitest, Testing Library, Vite, Cloudflare Pages.

---

### Task 1: Chat send recovery

**Files:**
- Create: `src/hooks/useRecoverableChatSend.ts`
- Create: `src/hooks/useRecoverableChatSend.test.ts`
- Create: `src/components/ChatWorkspace.test.tsx`
- Modify: `src/components/ChatWorkspace.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Write failing hook tests**

Test that `begin(content, parentId)` records a pending submission, `fail(error)` exposes it as recoverable, `restore(currentDraft)` returns the failed content only when the current draft is empty, and `succeed()` clears recovery state.

- [ ] **Step 2: Run the hook test and verify RED**

Run: `npx vitest run src/hooks/useRecoverableChatSend.test.ts`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the hook**

Expose:

```ts
type RecoverableChatSend = {
  content: string;
  parentId: string | null;
  error: string;
};

useRecoverableChatSend(): {
  pending: { content: string; parentId: string | null } | null;
  failed: RecoverableChatSend | null;
  begin(content: string, parentId: string | null): void;
  succeed(): void;
  fail(error: string): void;
  dismiss(): void;
  restore(currentContent: string): RecoverableChatSend | null;
}
```

- [ ] **Step 4: Write the workspace integration test**

Mock `streamChat` to reject once and succeed once. Render a minimal `ChatWorkspace`, enter content, submit, verify the error recovery panel and restored text, then retry and verify success callbacks.

- [ ] **Step 5: Integrate recovery UI**

Call `begin` before clearing the draft. On failure restore only into an empty composer. Render `CreationStatus`-compatible inline recovery actions with `aria-live="assertive"`. Explicit cancellation reports “已停止” without creating a retry record.

- [ ] **Step 6: Run focused and full verification**

Run:

```powershell
npx vitest run src/hooks/useRecoverableChatSend.test.ts src/components/ChatWorkspace.test.tsx
npm test
npm run typecheck:functions
npm run lint
npm run build
```

- [ ] **Step 7: Commit and publish**

Stage only chat recovery files plus logs, commit `feat: add recoverable chat sending`, push `origin main`, and watch the matching Actions run.

### Task 2: Image batch recovery

**Files:**
- Create: `src/hooks/useImageGenerationBatch.ts`
- Create: `src/hooks/useImageGenerationBatch.test.ts`
- Create: `src/components/ImageWorkspace.test.tsx`
- Modify: `src/components/ImageWorkspace.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Write failing batch-model tests**

Cover recipe retention, success/failure counts, failed-slot retry selection, and clearing after a fully successful retry.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run src/hooks/useImageGenerationBatch.test.ts`

- [ ] **Step 3: Implement batch state**

Represent a recipe as prompt, style, size, reference IDs, and count. Track each requested slot as pending, fulfilled, or rejected. Expose `start`, `settle`, `retryableIndexes`, and `clear`.

- [ ] **Step 4: Write the workspace integration test**

Mock two image requests where one rejects. Verify the summary says one success and one failure, then click retry and assert only one additional API call occurs.

- [ ] **Step 5: Integrate user-visible recovery**

Keep successful assets, display an inline batch summary, preserve the exact recipe, and offer “重试失败项”. A failed single-image operation uses the same recovery model.

- [ ] **Step 6: Verify, commit, push, and watch CI**

Run all repository gates, commit `feat: make image generation batches recoverable`, push main, and watch Actions.

### Task 3: Shared creation status experience

**Files:**
- Create: `src/components/CreationStatus.tsx`
- Create: `src/components/CreationStatus.test.tsx`
- Modify: `src/components/ChatWorkspace.tsx`
- Modify: `src/components/ImageWorkspace.tsx`
- Modify: `src/components/VideoWorkspace.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Write failing component tests**

Cover pending, success, recoverable error, disabled/offline reason, keyboard focus, and `aria-live`.

- [ ] **Step 2: Verify RED and implement the component**

Use a discriminated `status` prop and explicit primary/secondary action props. Avoid inline component definitions and memoize no trivial expressions.

- [ ] **Step 3: Replace duplicated status surfaces**

Adopt the component in all three workspaces while retaining media-specific details. Add responsive CSS so actions stack below 560px and maintain 44px touch targets.

- [ ] **Step 4: Rendered QA**

Use the built Pages runtime and Browser plugin. Verify desktop and mobile states, focus visibility, no clipping, no overlays, and console health.

- [ ] **Step 5: Verify, commit, push, and watch CI**

Commit `feat: unify creation status and recovery UX`.

### Task 4: Durable video recipes

**Files:**
- Modify: `src/hooks/useVideoTaskPersistence.ts`
- Modify: `src/hooks/useVideoTaskPersistence.test.ts`
- Create: `src/components/VideoWorkspace.test.tsx`
- Modify: `src/components/VideoWorkspace.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Write failing persistence tests**

Cover complete recipe persistence, migration from the previous task shape, preservation of failed tasks, clearing completed tasks, and corrupt storage.

- [ ] **Step 2: Verify RED and extend persisted types**

Add a `recipe` object with prompt, preset, FPS, dimensions, reference IDs, keyframes, optional negative prompt, and optional seed. Version the stored envelope.

- [ ] **Step 3: Write video integration tests**

Render from persisted active and failed tasks. Verify recipe details appear and “恢复参数” repopulates the form before creating a replacement task.

- [ ] **Step 4: Integrate video continuity**

Persist recipe at task creation, restore elapsed time from `startedAt`, retain failed tasks, and let the user dismiss or retry. Remove the inaccurate warning that closing the page automatically abandons a remotely running task.

- [ ] **Step 5: Verify, commit, push, and watch CI**

Commit `feat: preserve and retry video generation recipes`.

### Task 5: Project health and regression audit

**Files:**
- Modify only files justified by reproduced defects.
- Modify: `.agent/iteration-log.md`
- Modify: `.agent/orchestrator-log.md`

- [ ] **Step 1: Run the complete gate**

Run:

```powershell
npm ci
npm test
npm run typecheck:functions
npm run lint
npm run build
npm audit --omit=dev --audit-level=moderate
```

- [ ] **Step 2: Audit runtime and source risks**

Inspect sensitive-file status, debug statements, unsafe HTML, unguarded mutations, request cancellation, localStorage parsing, large components, and workflow/local command parity.

- [ ] **Step 3: Reproduce every defect before fixing**

For each defect, add a failing regression test, confirm the root cause, implement one focused fix, and rerun the relevant gate.

- [ ] **Step 4: Run local Pages acceptance**

Build, apply local migrations to isolated state, run `wrangler pages dev dist`, then verify session, login guard behavior, static routes, and changed workflows.

- [ ] **Step 5: Commit and publish**

Commit `fix: harden creation workflow reliability`, push main, and watch Actions.

### Task 6: Recovery center

**Files:**
- Create: `src/hooks/useCreationRecovery.ts`
- Create: `src/hooks/useCreationRecovery.test.ts`
- Create: `src/components/RecoveryCenter.tsx`
- Create: `src/components/RecoveryCenter.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/index.ts`
- Modify: `src/App.css`
- Modify: `.agent/iteration-log.md`
- Modify: `.agent/orchestrator-log.md`

- [ ] **Step 1: Write failing registry tests**

Cover versioned parsing, corrupt data, maximum 20 records, upsert by operation ID, ordering, dismiss, and clear.

- [ ] **Step 2: Implement the registry**

Expose typed records for `chat`, `image`, and `video`, each with workspace, label, summary, timestamp, and typed recovery payload.

- [ ] **Step 3: Write recovery-center component tests**

Verify count, grouped records, navigation callback, dismiss, empty state, and accessible labels.

- [ ] **Step 4: Connect workflow failures**

Write recoverable records from chat, image, and video failure paths. Add a shell trigger with a count badge. Selecting a record switches workspace and passes the payload to its restore handler.

- [ ] **Step 5: Rendered end-to-end QA**

Verify desktop and mobile navigation, recovery restoration, dismissal, console health, and page layout. Run the full local Pages acceptance matrix.

- [ ] **Step 6: Final verification and publish**

Run every local gate, inspect staged diff and secrets, commit `feat: add cross-workspace recovery center`, push main, watch Actions, and smoke-test both the deployment URL and public Pages domain.

