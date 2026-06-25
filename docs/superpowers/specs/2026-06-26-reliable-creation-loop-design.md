# Reliable Creation Loop Design

## Context

The application already has broad feature coverage and 375 unit tests, but its three core creation workflows do not provide a consistent recovery model:

- Chat clears the draft before the streaming request succeeds, so a failed request can cost the user their input.
- Image variation generation reports aggregate failures but does not retain enough information to retry failed work.
- Video task persistence retains only task status, not the creation recipe needed to understand or retry the task after a refresh.
- Existing tests are mostly unit-level; the previous campaign explicitly recommended integration coverage for chat, image generation, and video generation.

The campaign must add user-visible value while establishing those integration safety nets.

## Product Direction

Build one coherent “reliable creation” experience across chat, image, and video:

1. Preserve user intent before a remote operation.
2. Show a clear operation state.
3. Retain enough context to recover after failure or refresh.
4. Offer an explicit retry or continue action.
5. Cover the critical workflow with component-level integration tests.

No new runtime dependencies are required.

## Workflow Designs

### Chat recovery

Chat submission records the pending content and parent before clearing the visible composer. If streaming fails, the pending content is restored to the composer unless the user has already typed replacement text. The failure state exposes a “restore and retry” action. Aborted streams remain intentionally stopped and do not mislabel the result as a network failure.

The sending and recovery state lives in a focused hook so the 1,000-line workspace component does not absorb more state-management complexity.

### Image generation batches

Image generation retains a recipe containing prompt, style, size, references, and requested count. A batch result panel shows successful and failed counts. Partial failures expose “retry failed” and successful results remain available. A single generation failure also retains its recipe and offers retry.

The result model is represented by a focused pure helper and a small status component, enabling deterministic integration tests without coupling tests to the entire app shell.

### Unified creation status UX

Chat, image, and video use the same visual state vocabulary:

- pending: active accent, progress treatment, cancel when supported;
- success: confirmed result and next action;
- recoverable failure: inline explanation and primary retry action;
- offline: disabled action with a visible reason.

Desktop and mobile layouts keep recovery actions adjacent to the failed operation. Focus moves to the primary recovery action when an error panel appears. Status is announced through `aria-live`.

### Video task continuity

Persist the complete video recipe with the active task: prompt, preset, FPS, dimensions, references, keyframe mode, negative prompt, seed, and start time. On reload, the workspace restores the recipe and displays it beside task status. Failed tasks remain available as recoverable records instead of disappearing. Users can restore the recipe into the form and create a replacement task.

Completed task persistence is cleared only after the success state has been surfaced and the asset list refreshed.

### Recovery center

A lightweight recovery center in the authenticated app shell summarizes recoverable operations stored locally:

- failed chat submissions;
- failed image recipes;
- failed or interrupted video recipes.

It does not duplicate full workflow UIs. Selecting an item navigates to the relevant workspace and restores its context. Users can dismiss obsolete records. Storage is versioned and bounded to avoid unbounded local data.

## Architecture

- `src/hooks/useRecoverableOperation.ts`: generic recoverable-operation state transitions.
- `src/hooks/useCreationRecovery.ts`: bounded, versioned local recovery registry.
- `src/components/CreationStatus.tsx`: shared pending/success/error status surface.
- `src/components/RecoveryCenter.tsx`: compact cross-workspace recovery list.
- Existing workspaces consume these focused interfaces.
- Pure recipe/result functions are tested separately; component integration tests use mocked API modules and real user interactions.

The app shell remains responsible only for navigation and passing recovery callbacks. Remote API contracts remain unchanged.

## Error Handling

- Preserve the original error message for user display.
- Never overwrite newer user input during automatic restoration.
- Treat explicit cancellation separately from failure.
- Store only operation content and non-sensitive generation parameters; never store credentials or session data.
- Corrupt or unknown-version recovery data is discarded safely.
- Bound recovery history to the latest 20 records.

## Validation

Each product change follows red-green-refactor:

- Chat integration test: failed stream restores input and supports retry.
- Image integration test: partial batch failure shows counts and retries only failed requests.
- Video integration test: refresh restores task recipe and failed task can repopulate the form.
- Recovery center test: records navigate, restore, and dismiss correctly.

Every commit runs the relevant focused tests, then the repository gates:

`npm test`, `npm run typecheck:functions`, `npm run lint`, and `npm run build`.

Rendered QA uses the built Pages runtime, desktop and mobile viewports, console checks, and representative success/failure interactions. Each commit is pushed to `main` and its `Deploy Cloudflare Pages` workflow is watched to completion.

## Scope Boundaries

- No new backend tables or public sharing of recovery records.
- No general job queue or service-worker background generation.
- No redesign of unrelated settings, asset editing, export, or conversation-management features.
- No broad rewrite of `ChatWorkspace`; only focused extraction needed by the recovery flow.

