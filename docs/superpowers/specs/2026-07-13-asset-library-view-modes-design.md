# Asset Library View Modes and Keyboard Access Design

## Context

The asset library exposes grid, list, and detail view controls, but production browser evidence shows that choosing list or detail only changes the pressed button. The asset container always renders `class="asset-grid"`, so the existing `view-list` and `view-detail` styles are never activated. As a result, all three choices render the same card grid and the controls promise behavior they do not deliver.

The same live audit found two keyboard-access gaps in the primary asset workflow. Image previews are clickable `div` elements that cannot receive keyboard focus, and each per-asset checkbox has no accessible name. The view selector also advertises a `radiogroup` while its children use toggle-button semantics (`aria-pressed`), creating a mismatched accessibility contract.

## Decision

Complete the existing three-mode design and make its primary controls native and keyboard-safe:

- Keep grid as the default compact gallery.
- Make list a true single-column horizontal-row layout, with a bounded thumbnail, flexible metadata, and actions that remain visible without horizontal page overflow.
- Make detail a roomier card gallery with a wider minimum card and a larger preview, visibly distinct from grid.
- Apply the selected mode as a class on the asset container so the state controls actual layout.
- Model the selector as a labelled button group whose three buttons expose `aria-pressed`; this matches the existing interaction and native button keyboard behavior.
- Render image previews as labelled buttons. Keep video previews as non-button containers because their native video controls are already interactive and must not be nested inside another button.
- Give every per-asset checkbox a filename-specific accessible name and let the checkbox itself own click/keyboard selection, while preserving mouse Shift range selection.

Alternatives considered:

- Remove list and detail controls. Rejected because the code and styles show an intentional existing feature, and different asset densities are valuable for browsing and metadata review.
- Implement a custom ARIA radio group. Rejected because it would require roving focus and arrow-key behavior while adding no value over the existing toggle-button interaction.
- Make the entire asset card clickable. Rejected because cards contain checkboxes, links, video controls, and action buttons; one card-wide action would create nested interaction conflicts.

## Interaction Contract

- The view selector is exposed as `role="group"` with accessible name `视图模式`.
- Its buttons are named `网格视图`, `列表视图`, and `详情视图`; exactly one has `aria-pressed="true"`.
- The default asset container uses the existing grid layout. Choosing list adds `view-list`; choosing detail adds `view-detail`; returning to grid removes both modifier classes.
- List mode uses one content column on desktop and mobile. Cards are horizontal rows with bounded thumbnails; narrow screens keep a compact thumbnail-and-metadata row and move actions to a full-width wrapped row without horizontal page overflow.
- Detail mode uses wider cards and a larger preview than grid, while remaining responsive; on phone widths its square preview stays visibly taller than the default grid preview.
- Each image exposes one button named `预览 <filename>`; Enter or Space invokes the existing `onPreview(asset)` callback.
- Video media keep native video controls and do not expose a redundant preview button.
- Each asset exposes one checkbox named `选择素材 <filename>`. Space toggles that asset. Mouse Shift-click retains contiguous range selection.
- Existing filtering, sorting, metadata, tag, collection, download, deletion, batch selection, and empty-state behavior remain unchanged.

## Visual Constraints

- Reuse the existing asset cards, spacing tokens, surfaces, borders, radii, shadows, colors, Lucide icons, and focus-ring conventions.
- Do not add assets, dependencies, routes, storage, or persisted view-mode state.
- Keep image cropping at `object-fit: cover`; list thumbnails must remain bounded and detail previews must not cause layout shift.
- At 390 px viewport width, grid switches to one column, list remains a compact two-column row, detail uses a taller square preview in a roomier one-column card, and every view plus multi-selection batch actions must fit without horizontal overflow.

## Implementation Boundaries

- Modify only `AssetWorkspace`, its focused tests, asset-library CSS, this design document, and the matching implementation plan.
- Keep `AssetWorkspace` props and backend APIs unchanged.
- Do not change upload, generation, deletion, authentication, storage schema, dependency, or deployment behavior.

## Verification

- Add regression tests for modifier classes, group/toggle semantics, keyboard preview activation, named checkbox selection, and the video-control boundary.
- Run the focused test file, full unit suite, function typecheck, lint, production build and budget checks, dependency/security/secret gates, remote migration check, and diff hygiene scans.
- Use a real image in a browser to compare grid, list, and detail layouts on desktop and mobile, verify preview and checkbox keyboard behavior, inspect accessible roles/names, check console errors and horizontal overflow, and delete the disposable production asset afterward.
- Tie GitHub Actions, Cloudflare deployment, exact-SHA production smoke, and live browser evidence to the pushed commit.
