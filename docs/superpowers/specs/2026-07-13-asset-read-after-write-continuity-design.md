# Asset Read-after-write Continuity Design

**Date:** 2026-07-13

## Problem

Production acceptance observed a real upload return HTTP 201 and render its two references while an immediate independent `/api/assets` read briefly returned the previous list. The current client always discards the authoritative upload/generation response and replaces state with that immediate list. A stale read can therefore hide assets that are already committed. `UploadBox` also handles upload transport and post-commit refresh in one catch block, so a rejected refresh callback is presented as an upload failure even though retrying can create a duplicate.

## Goal

Make committed assets visible immediately and preserve truthful completion semantics across file upload, global drop, image editing, single image generation, and batch image generation. Keep API routes, payloads, persistence, visual language, and successful notices unchanged.

## Architecture

- Add `mergeCommittedAssets(listed, committed)` and `reconcileAssetRefresh(current, listed, committed)` in `src/app-state.ts`. Committed order is preserved, a fresher listed copy replaces matching optimistic metadata, duplicates are removed, and concurrent committed state survives overlapping stale write refreshes. Ordinary no-argument refreshes still replace state from the listed response.
- Let asset-refresh callbacks optionally receive authoritative `AssetItem[]` values returned by write endpoints and return whether the follow-up list refresh succeeded. `App` merges committed values immediately, then reconciles the normal list refresh without allowing a stale response to erase the current or concurrent committed assets.
- Mark client `/api/assets` requests as `cache: "no-store"` and return `Cache-Control: private, no-store` from the authenticated list endpoint.
- Pass committed assets through `UploadBox`, `GlobalDropZone`, image editing, and image generation flows.
- In `UploadBox`, isolate the post-commit callback from the abortable upload catch. If refresh rejects, retain the success summary and report that the file was uploaded but the list refresh failed; never invite a duplicate retry by calling the upload itself failed.

## Invariants

- A 201 response is immediately represented in client state even when the next list read is stale or unavailable.
- Listed metadata wins for a matching ID; committed response order wins for newly written assets.
- An asset ID appears at most once.
- Upload cancellation and transport errors retain existing messages and behavior.
- A post-commit refresh failure cannot remove the success summary or be described as an upload failure.
- Ordinary no-argument refresh calls retain existing behavior.

## Verification

Focused tests cover merge ordering/deduplication, concurrent write reconciliation, no-store API semantics, authoritative callback payloads, same-file retry, and truthful post-commit failure notices. Local browser acceptance delays `/api/assets` after a successful upload and verifies the new asset remains available from the committed response. Production acceptance uses an exact deployment and a disposable upload, verifies immediate Image and Assets visibility, then deletes the QA asset and confirms zero matches.
