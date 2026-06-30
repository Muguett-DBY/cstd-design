# Command Palette Trust Loop Design

## Goal

Make the existing command palette reliably discoverable and keyboard-operable without replacing it or adding a dependency.

## Chosen approach

Strengthen the current `CommandPalette` in six independently releasable increments. Search will score labels, descriptions, and aliases; keyboard selection will stay valid as results change; the interface will expose result and selection feedback; successful commands will produce a small persisted recent section; storage input will be validated; and the dialog will expose a complete combobox/focus contract.

This is preferred over a scoring-only patch because the orchestrator requires a complete product loop, and over adopting a command-menu package because replacement would add migration, bundle, styling, and accessibility regression risk without solving a product requirement the current component cannot meet.

## Boundaries and data flow

- `CommandPalette.tsx` owns ranking, grouping, transient selection, recent command ids, execution, and dialog accessibility.
- `storage-keys.ts` owns the recent-command storage key and backup registration.
- `App.tsx` continues to supply commands and remains unaware of ranking and history details.
- Local storage contains only a bounded array of command ids. Unknown, duplicate, malformed, and stale ids are ignored.

## Interaction design

- A query may match label text, description text, or aliases. Label matches rank above equivalent description and alias matches.
- Changing a query selects the first result. Arrow navigation never points outside the current result set and keeps the active option visible.
- The list reports result count and keyboard position. Recent commands appear only for an empty query and do not duplicate their normal group entries.
- Executing by click or Enter records the command. Search state is cleared between openings.
- The input uses combobox semantics linked to the listbox and active option. Closing restores focus to the element active before opening.

## Failure handling

Storage access and JSON parsing are non-fatal. Invalid history falls back to no recent commands. Removed command ids are pruned from the next persisted history.

## Verification

Each stage starts with a failing component test, adds the smallest implementation, runs targeted tests, then runs the complete repository gate. UI-facing stages also receive desktop and mobile browser QA. Every stage is committed and pushed to `main`, followed by GitHub Actions and exact-deployment smoke verification.

