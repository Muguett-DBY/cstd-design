# Durable asset deletion design

## Problem

Asset deletion previously removed the R2 object before deleting its D1 metadata. A successful R2 delete followed by a D1 failure left a visible asset row whose file no longer existed. Scope clearing also spread its D1 changes across separate calls, so a mid-request failure could leave only part of the requested scope deleted.

## Decision

Treat D1 as the logical source of truth and record physical cleanup durably before touching R2:

1. In one D1 batch, enqueue each now-unreferenced object key and delete the corresponding metadata. Scope clearing includes its chat and video-task deletions in that same batch.
2. After the D1 batch commits, delete eligible R2 objects in bounded chunks.
3. A successful R2 delete acknowledges and removes its queue row. A failed delete keeps the row, records a bounded exponential retry time, and still reports logical deletion success.
4. Authenticated asset-list requests drain due queue entries in `waitUntil`, so cleanup retries without delaying the user-facing list response.
5. Every drain query rechecks that no current asset row references the object key. Duplicate or shared object keys therefore cannot be deleted while still in use.

## API behavior

- Single deletion remains idempotent and returns `ok: true`; `cleanupDeferred` exposes whether physical cleanup was queued.
- Scope clearing retains existing logical deletion counts and adds `r2Deferred` alongside successful `r2Objects` cleanup.
- D1 transaction failures still fail the request and never touch R2.

## Verification contract

- Unit tests cover D1-before-R2 ordering, D1 rollback safety, deferred R2 cleanup, idempotency, queue draining, and atomic scope clearing.
- A real local D1 migration/SQL probe validates the migration, shared-key guard, queue insert/delete statements, and retry expression.
- Local Pages browser acceptance must verify upload, delete, empty-state persistence after reload, and a drained queue.
