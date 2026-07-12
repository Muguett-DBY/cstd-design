# Global Search Native Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make global search a browser-native, labelled modal with reliable focus containment, scroll locking, Escape/backdrop close behavior, and opener focus restoration without changing search semantics.

**Architecture:** `GlobalSearchModal` continues to own query and result state. A dialog ref controls `showModal()`, the existing input ref receives initial focus, and an opener ref plus body-overflow snapshot restores page state on cleanup. Existing CSS supplies the full-screen dimmed surface while the native dialog top layer supplies modality.

**Tech Stack:** React 19, TypeScript, native HTML `<dialog>`, Testing Library, Vitest, Vite, Cloudflare Pages.

## Global Constraints

- Work directly on `main`; do not create a branch or use `git add .`.
- Preserve the `GlobalSearchModal` public API and every existing search/result callback.
- Do not add dependencies or change backend, storage schema, authentication, or deployment configuration.
- Production evidence must be tied to the exact pushed commit SHA.

---

### Task 1: Specify the modal lifecycle with failing component tests

**Files:**
- Modify: `src/components/GlobalSearchModal.test.tsx`
- Reference: `src/components/GlobalSearchModal.tsx`

**Interfaces:**
- Consumes: existing `GlobalSearchModal` props and `onClose: () => void`.
- Produces: regression coverage for native dialog opening, cancel, focus, scroll locking, cleanup, and StrictMode effect replay.

- [x] **Step 1: Add a reusable minimal prop fixture and dialog mock**

```tsx
import { StrictMode, type ComponentProps } from "react";

function createModalProps(): ComponentProps<typeof GlobalSearchModal> {
  return {
    open: true,
    onClose: vi.fn(),
    conversations: [],
    activeMessages: [],
    assets: [],
    onSelectConversation: vi.fn(),
    onSelectAsset: vi.fn(),
  };
}

beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  }
  vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function showModal(this: HTMLDialogElement) {
    Object.defineProperty(this, "open", { configurable: true, value: true });
    this.setAttribute("open", "");
  });
  vi.clearAllMocks();
  document.body.style.overflow = "auto";
});
```

- [x] **Step 2: Add focused lifecycle tests before changing production code**

```tsx
test("opens as a labelled native modal, focuses search, and locks scrolling", () => {
  render(<GlobalSearchModal {...createModalProps()} />);
  const dialog = screen.getByRole("dialog", { name: "全局搜索" });
  expect(dialog.tagName).toBe("DIALOG");
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "全局搜索" }));
  expect(document.body.style.overflow).toBe("hidden");
});

test("routes native cancel through the controlled close callback", () => {
  const props = createModalProps();
  render(<GlobalSearchModal {...props} />);
  const event = new Event("cancel", { cancelable: true });
  fireEvent(screen.getByRole("dialog", { name: "全局搜索" }), event);
  expect(event.defaultPrevented).toBe(true);
  expect(props.onClose).toHaveBeenCalledOnce();
});

test("restores the opener and prior body overflow when unmounted", () => {
  const opener = document.body.appendChild(document.createElement("button"));
  opener.focus();
  const { unmount } = render(<GlobalSearchModal {...createModalProps()} />);
  unmount();
  expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).toBe("auto");
  opener.remove();
});

test("keeps search focus when StrictMode replays effects", () => {
  render(<StrictMode><GlobalSearchModal {...createModalProps()} /></StrictMode>);
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "全局搜索" }));
});
```

- [x] **Step 3: Run the focused test and verify the expected RED state**

Run: `npx vitest run src/components/GlobalSearchModal.test.tsx`

Expected: the new lifecycle tests fail because the component renders a `DIV`, does not call `showModal()`, does not lock scrolling, and does not restore opener focus.

### Task 2: Implement native modal behavior and preserve layout

**Files:**
- Modify: `src/components/GlobalSearchModal.tsx`
- Modify: `src/App.css`
- Test: `src/components/GlobalSearchModal.test.tsx`

**Interfaces:**
- Consumes: `open`, `onClose`, and the existing `inputRef`.
- Produces: the same rendered search UI inside a native modal surface; no public API change.

- [x] **Step 1: Add refs and the controlled dialog lifecycle**

```tsx
const dialogRef = useRef<HTMLDialogElement | null>(null);
const openerRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (!open) return;
  openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const dialog = dialogRef.current;
  if (dialog && !dialog.open) dialog.showModal();
  inputRef.current?.focus();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = previousOverflow;
    openerRef.current?.focus();
  };
}, [open]);
```

Delete the window-level Escape listener because native `cancel` now owns Escape.

- [x] **Step 2: Replace the simulated dialog wrapper**

```tsx
<dialog
  ref={dialogRef}
  className="global-search-overlay"
  aria-label="全局搜索"
  onCancel={(event) => {
    event.preventDefault();
    onClose();
  }}
  onClick={(event) => {
    if (event.target === dialogRef.current) onClose();
  }}
>
  <div className="global-search" onClick={(event) => event.stopPropagation()}>
    {/* existing search UI unchanged */}
  </div>
</dialog>
```

- [x] **Step 3: Normalize native dialog box styles while preserving visual placement**

```css
.global-search-overlay {
  position: fixed;
  inset: 0;
  z-index: 250;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  border: 0;
  padding: 12vh 24px 24px;
  background: rgba(0, 0, 0, 0.5);
  color: inherit;
  overflow: hidden;
  place-items: flex-start center;
}

.global-search-overlay[open] { display: grid; }
.global-search-overlay::backdrop { background: transparent; }

.global-search { min-width: 0; }
.global-search-input { min-width: 0; }

@media (max-width: 520px) {
  .global-search-overlay { padding: 10vh 16px 16px; }
  .global-search { width: 100%; }
  .global-search-status { align-items: flex-start; }
  .global-search-shortcuts { display: none; }
}
```

- [x] **Step 4: Run focused tests to verify GREEN**

Run: `npx vitest run src/components/GlobalSearchModal.test.tsx`

Expected: all global-search tests pass with no warnings.

- [x] **Step 5: Run static checks for the changed surface**

Run: `npm run lint && npm run build`

Expected: exit code 0 and build chunk budget passes.

### Task 3: Verify, publish, and accept the exact production deployment

**Files:**
- Stage only: `src/components/GlobalSearchModal.tsx`, `src/components/GlobalSearchModal.test.tsx`, `src/App.css`, the design spec, and this plan.

**Interfaces:**
- Consumes: final local build and repository release scripts.
- Produces: one reviewed commit on `main`, a green exact-SHA deployment, and production browser evidence.

- [x] **Step 1: Run the complete local gate**

Run: `npm test`, `npm run typecheck:functions`, `npm run lint`, `npm run build`, `npm audit --audit-level=high`, `npm install-scripts ls`, `gitleaks git --redact --no-banner`, `npm run verify:production-secrets`, `npx wrangler d1 migrations list cstd-design --remote`, and `git diff --check`.

Expected: every command exits 0; no vulnerabilities, unreviewed install scripts, leaks, missing secrets, or pending migrations.

- [x] **Step 2: Verify built behavior locally in a real browser**

Serve `dist` with `wrangler pages dev`, authenticate through the local E2E-only session endpoint, and verify desktop plus 390×844 mobile behavior: native `:modal`, labelled dialog, input focus, background focus rejection, body scroll lock, no horizontal overflow, Escape/backdrop close, opener restoration, zero console warnings/errors, and 200 responses from session/conversations/assets/readiness.

- [x] **Step 3: Review, stage explicitly, commit, and push**

```powershell
git add -- src/App.css src/components/GlobalSearchModal.tsx src/components/GlobalSearchModal.test.tsx docs/superpowers/specs/2026-07-11-global-search-native-modal-design.md docs/superpowers/plans/2026-07-11-global-search-native-modal.md
git commit -m "fix: harden global search modal accessibility"
git push origin main
```

- [x] **Step 4: Accept CI and Cloudflare by exact SHA**

Match the new SHA to the `Deploy Cloudflare Pages` run, require every job step to pass, confirm the newest production deployment Source matches the short SHA, and run `$env:CSTD_COMMIT_SHA='<full-sha>'; npm run smoke:production`.

- [x] **Step 5: Verify production in a real browser**

Use the exact deployment URL, authenticate without logging the secret, then repeat desktop/mobile modal, focus, close, overflow, console, and API checks. Confirm the production alias serves the same hashed application asset and leave `main`, `origin/main`, and the worktree clean and identical.
