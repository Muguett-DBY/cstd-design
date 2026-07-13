# Asset Deletion Continuity Design

**Date:** 2026-07-13

## Problem

The asset delete endpoints can commit successfully while the client-side follow-up `/api/assets` refresh is stale or unavailable. `AssetWorkspace` currently calls `onAssetsChanged()` without identifying the committed deletion, so `App` keeps the deleted card until a later successful refresh. The card can then open a media URL that correctly returns 404. Batch deletion has the same gap and cannot distinguish the IDs that were deleted from IDs whose requests failed.

## Goal

Make confirmed single and batch deletions immediately authoritative in client state, keep failed batch items visible, and prevent the immediate stale list response from restoring deleted cards. Preserve routes, API response schemas, confirmation dialogs, filters, and ordinary refresh behavior.

## Architecture

- Extend `AssetRefreshCallback` with an optional second `removedAssetIds` argument. Existing upload and generation callers continue passing only committed assets.
- Add deletion-aware state helpers in `src/app-state.ts`. Removed IDs are filtered from current, committed, and listed values, with deletion winning if an ID appears in more than one input.
- Coordinate overlapping asset refreshes with monotonic request tickets plus pending committed/deleted overlays. Older responses cannot overwrite newer applied responses; a pending mutation remains active until the newest outstanding response confirms the authoritative list.
- Let `App.refreshAssets` apply pending mutations before starting the list request. When the request succeeds, reconcile through the coordinator; when it fails, the local mutation remains represented and the callback returns `false`.
- After a single delete succeeds, pass that ID to the callback. After batch deletion, derive successful IDs from `Promise.allSettled` and pass only those IDs.
- Keep failed batch IDs selected so the user can retry them without reconstructing the selection. Clear selection only after every requested delete succeeds.
- Report a truthful post-commit synchronization warning when the refresh callback rejects or returns `false`; do not describe a completed deletion as failed.

## Invariants

- A fulfilled delete request removes that asset from the current view even if the next list request fails.
- A stale list response cannot restore an ID committed by the same delete flow.
- A response from an older overlapping request cannot overwrite a newer applied asset state.
- A rejected delete request remains visible and selected.
- Batch success/failure counts describe API outcomes, independently of refresh availability.
- An asset ID appears at most once and deletion wins over a conflicting committed/listed copy.
- Calls with no committed assets and no removed IDs retain authoritative list-replacement behavior.

## Alternatives considered

- Reload-only recovery leaves a known-deleted card interactive and encourages repeated destructive actions.
- Optimistically removing before the delete response can hide an item whose request actually failed.
- Server-side tombstones would address cross-service deletion transactions, but are unnecessary for this verified client continuity defect and would require a migration and API contract expansion.

## Verification

Focused regressions cover pure stale-list reconciliation, ordinary refresh replacement, single deletion callback payloads, partial batch success, failed-item selection, and refresh failure notices. Local Pages acceptance will force a stale asset-list response after a real delete and verify the deleted card stays absent on desktop and mobile. Production acceptance will create a disposable upload, delete it through the UI, verify immediate disappearance and zero server matches, then clean all QA data.
