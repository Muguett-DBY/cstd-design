# Creation Continuity Sprint Design

## Goal

Extend the existing creation center from a recovery/status surface into a practical continuation hub, then consolidate the mobile app shell around one accessible bottom navigation.

## Product increment

- Select the most recent conversation and generated image from data already loaded by `App`.
- Show a “继续创作” section in the creation center with direct actions for the latest conversation, latest image, and video workspace.
- Keep recovery records after opening them. Opening only restores the payload; deletion remains an explicit “忽略” action so a user cannot lose the fallback before a retry succeeds.
- Count only completed video history entries as completed work.

The selection logic will live in a small pure helper so ordering and filtering are independently testable. No new persistence model, API, or dependency is required.

## UI/UX increment

- Remove the legacy `mobile-tabs` navigation because `MobileBottomNav` already renders at the same breakpoint.
- Make the remaining mobile navigation fixed, safe-area aware, keyboard/focus visible, and visually explicit about the active workspace.
- Reflow the creation-center panel on narrow screens so quick continuation actions remain reachable without colliding with navigation.

## Error handling and boundaries

- Missing conversations or generated images produce clear fallback actions instead of empty cards.
- Invalid dates are treated as oldest rather than breaking sorting.
- External video URLs keep their existing safe `target="_blank"` and `rel="noreferrer"` behavior.
- Existing untracked campaign history remains untouched.

## Verification

- TDD for selection/filtering and continuation actions.
- Component coverage for the upgraded mobile navigation.
- Full test, functions typecheck, lint, build, and diff checks for each stage.
- Local Cloudflare Pages runtime plus desktop/mobile browser interaction and console checks for the UI/UX stage.
- Push each stage separately to `main`, then watch GitHub Actions to completion.
