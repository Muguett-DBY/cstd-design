# Atomic Media Persistence Design

**Date:** 2026-07-13

## Problem

The three media creation paths write an object to R2 and metadata to D1 as separate operations. Multi-file uploads insert one D1 row after each R2 write; if a later insert fails, cleanup removes every uploaded object while earlier rows remain and point at missing media. Image generation can leave an R2 object when its D1 insert fails. Video completion can leave an object and asset row when the task-link update fails, so a later poll can create a duplicate.

## Goal

Keep every in-request media write internally consistent without changing routes, response payloads, validation, provider behavior, database schema, or UI. A successful operation must expose all expected D1 rows and R2 objects. A failed persistence operation must commit no partial D1 batch and must attempt to delete every R2 key touched by that operation.

## Architecture

Add a small shared persistence boundary in `functions/_shared/asset-persistence.ts`. It receives complete asset records and their R2 bodies, writes all attempted objects first, then sends all asset inserts plus any related statements through one `D1Database.batch()` call. D1 documents batched statements as a transaction that aborts or rolls back the entire sequence when one statement fails.

The helper checks both thrown batch failures and resolved results whose `success` flag is false. On any R2 or D1 failure it best-effort deletes every attempted R2 key, preserves the original error, and emits a generic cleanup error only if compensation itself fails.

Endpoint integration:

- `/api/uploads` prepares every validated file record, then persists all records in one call. No asset row is inserted before every R2 write has succeeded.
- `/api/images` persists the generated object and its asset row through the same boundary.
- `/api/videos/:id` links the still-unlinked task first and conditionally inserts the asset only when that link exists in the same D1 batch. A concurrent completion or deletion produces zero inserted rows, which the helper treats as failure and cleans from R2 instead of creating an orphan or duplicate.

## Invariants

- D1 asset inserts for one request are atomic.
- The video task is linked in the same transaction as its asset insert.
- Cleanup includes a key whose R2 `put` was attempted even when that `put` rejects.
- Cleanup failure never replaces the original persistence failure.
- Response bodies, status codes on success, filenames, object keys, MIME handling, limits, and rate limits remain unchanged.

## Non-goals and residual boundary

This does not create a distributed transaction between R2 and D1. If R2 deletion is itself unavailable during compensation, an unreferenced object can remain; the failure is logged and no broken D1 row is committed. Durable cleanup queues or schema changes are outside this focused change.

## Verification

Focused tests cover successful multi-asset batching, atomic D1 failure cleanup, failed R2 write cleanup, failed-result detection, related-statement inclusion, and original-error preservation. Release gates add Functions typecheck, the full suite, lint, build/budget, dependency and secret scans, remote migration verification, and exact-diff review. Production acceptance performs a real two-file browser upload on the exact deployment, verifies both assets are readable and listed, then deletes both and confirms zero matching QA assets.
