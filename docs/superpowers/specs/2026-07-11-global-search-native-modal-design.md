# Global Search Native Modal Design

## Context

Global search is a high-frequency keyboard flow (`Ctrl/Cmd+Shift+F`) but currently uses a full-screen `div` with `role="dialog"`. It focuses the search input and listens for Escape, yet it does not use the browser modal top layer, constrain focus, lock background scrolling, or restore the invoking control.

## Decision

Render `GlobalSearchModal` as a native `<dialog>` and open it with `showModal()`. Keep search indexing, grouping, saved searches, result navigation, and selection callbacks unchanged.

Alternatives considered:

- Keep the `div` and add a manual focus trap. Rejected because it duplicates browser behavior and the code already established a native-dialog pattern for onboarding and settings.
- Introduce a shared modal abstraction first. Deferred because it would broaden this accessibility fix into a cross-component refactor before the remaining modal variants have converged.

## Interaction Contract

- Opening presents exactly one labelled native modal, places focus in the search input, and locks document scrolling.
- Native `cancel` (Escape) prevents the browser from mutating controlled state directly and calls `onClose` once.
- Clicking the full-screen dialog surface outside the search panel calls `onClose`; clicks inside the panel do not.
- While open, browser modal behavior prevents focus from moving to background controls.
- Unmounting or switching `open` to false restores the previous body overflow value and returns focus to the element that invoked search when it is still focusable.
- React StrictMode effect replay must leave focus inside the modal.
- At 520 px and below, the panel fills the available content width without a horizontal scrollbar and keyboard-only hint chips are hidden.
- Existing query, result, saved-search, keyboard-selection, and result-routing behavior remains unchanged.

## Implementation Boundaries

- Change only `GlobalSearchModal`, its focused tests, and the existing global-search overlay styles.
- Remove the window-level Escape listener after native `cancel` owns that behavior.
- Preserve the component public API and all application data flows.
- Do not introduce dependencies or alter backend, storage schema, authentication, or deployment configuration.

## Verification

- Add regression tests for native modal opening, accessible labelling, scroll lock, cancel handling, opener restoration, and StrictMode focus replay.
- Run the focused test file, full test suite, function typecheck, lint, production build and budget check, dependency/security gates, secret verification, and remote migration check.
- Verify the built app locally and the exact production deployment in desktop and 390 px mobile browser sessions, including focus containment, Escape/backdrop close, focus restoration, no overflow, console cleanliness, and key API responses.
