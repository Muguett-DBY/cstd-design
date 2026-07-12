# Asset Library View Modes and Keyboard Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all three asset-library view choices visibly functional and make image preview and per-asset selection fully operable by keyboard and assistive technology.

**Architecture:** `AssetWorkspace` remains the owner of transient view and selection state. It projects `viewMode` into an asset-container modifier class and uses native button/checkbox controls for interaction; CSS implements the three responsive presentations without changing asset data or APIs. Focused Testing Library tests establish the interaction and accessibility contracts before implementation, while production Playwright acceptance verifies computed layout and responsive behavior.

**Tech Stack:** React 19, TypeScript, Testing Library, user-event, Vitest, CSS, Vite, Cloudflare Pages, Playwright CLI.

## Global Constraints

- Work directly on `main`; do not create a branch, force push, or use `git add .`.
- Preserve `AssetWorkspace` props, asset APIs, storage schema, existing filtering/sorting/batch behavior, and native video controls.
- Do not add dependencies, routes, assets, or persisted view-mode state.
- Reuse the current design tokens, card structure, Lucide icons, and focus-ring conventions.
- Production evidence must be tied to the exact pushed commit SHA, and disposable production data must be removed after verification.

---

### Task 1: Specify functional view modes and coherent toggle semantics

**Files:**
- Modify: `src/components/AssetWorkspace.test.tsx`
- Modify: `src/components/AssetWorkspace.tsx`

**Interfaces:**
- Consumes: existing local `viewMode: "grid" | "list" | "detail"` state.
- Produces: `.asset-grid`, optional `.view-list`/`.view-detail` modifiers, and a labelled toggle-button group.

- [x] **Step 1: Write failing tests for container modifiers and group semantics**

```tsx
const viewGroup = screen.getByRole("group", { name: "视图模式" });
const assetGrid = document.querySelector(".asset-grid");
expect(viewGroup).toBeTruthy();
expect(screen.getByRole("button", { name: "网格视图" })).toHaveAttribute("aria-pressed", "true");
await user.click(screen.getByRole("button", { name: "列表视图" }));
expect(assetGrid).toHaveClass("view-list");
await user.click(screen.getByRole("button", { name: "详情视图" }));
expect(assetGrid).toHaveClass("view-detail");
```

- [x] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/components/AssetWorkspace.test.tsx`

Expected: FAIL because the selector is exposed as `role="radiogroup"` instead of `role="group"`, and `.asset-grid` never receives a view modifier.

- [x] **Step 3: Implement the minimal state-to-DOM contract**

```tsx
const assetGridClassName = [
  "asset-grid",
  viewMode === "list" ? "view-list" : "",
  viewMode === "detail" ? "view-detail" : "",
].filter(Boolean).join(" ");

<div className="view-mode-toggle" role="group" aria-label="视图模式">
  <button type="button" aria-label="网格视图" aria-pressed={viewMode === "grid"}>
    <Grid size={14} />
  </button>
  <button type="button" aria-label="列表视图" aria-pressed={viewMode === "list"}>
    <List size={14} />
  </button>
  <button type="button" aria-label="详情视图" aria-pressed={viewMode === "detail"}>
    <LayoutList size={14} />
  </button>
</div>
<div className={assetGridClassName}>
```

- [x] **Step 4: Run the focused tests and require GREEN**

Run: `npm test -- src/components/AssetWorkspace.test.tsx`

Expected: PASS for the existing suite and the new view-mode tests.

### Task 2: Specify native keyboard preview and asset selection

**Files:**
- Modify: `src/components/AssetWorkspace.test.tsx`
- Modify: `src/components/AssetWorkspace.tsx`

**Interfaces:**
- Consumes: existing `onPreview(asset)` callback and `toggleSelect(id, index, shiftKey)` selection helper.
- Produces: `button[aria-label="预览 <filename>"]` for images and `input[aria-label="选择素材 <filename>"]` for every asset.

- [x] **Step 1: Write failing tests for keyboard preview and named selection**

```tsx
const preview = screen.getByRole("button", { name: "预览 first.png" });
preview.focus();
await user.keyboard("{Enter}");
await user.keyboard(" ");
expect(onPreview).toHaveBeenNthCalledWith(1, assets[0]);
expect(onPreview).toHaveBeenNthCalledWith(2, assets[0]);

const checkbox = screen.getByRole("checkbox", { name: "选择素材 first.png" });
checkbox.focus();
await user.keyboard(" ");
expect(screen.getByText("已选 1 项")).toBeTruthy();
```

Use this complete video fixture and boundary assertion:

```tsx
const videoAsset: AssetItem = {
  id: "asset-video",
  kind: "video",
  mediaType: "video/mp4",
  filename: "clip.mp4",
  size: 4096,
  createdAt: "3",
  url: "/clip.mp4",
};
const { container } = render(
  <AssetWorkspace
    assets={[assets[0], videoAsset]}
    onAssetsChanged={vi.fn()}
    onClearAll={vi.fn()}
    onNotice={vi.fn()}
    onPreview={onPreview}
    onRequestConfirm={vi.fn()}
  />,
);
expect(screen.queryByRole("button", { name: "预览 clip.mp4" })).toBeNull();
expect(container.querySelector("video")?.controls).toBe(true);
```

- [x] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/components/AssetWorkspace.test.tsx`

Expected: FAIL because image previews are non-focusable `div` elements and item checkboxes have no accessible names.

- [x] **Step 3: Implement native controls without nesting video interaction**

```tsx
<input
  type="checkbox"
  checked={selected.has(asset.id)}
  readOnly
  aria-label={`选择素材 ${asset.filename}`}
  onClick={(event) => {
    event.stopPropagation();
    toggleSelect(asset.id, index, event.shiftKey);
  }}
/>

{asset.mediaType.startsWith("video") ? (
  <div className="asset-preview"><video src={asset.url} controls /></div>
) : (
  <button
    type="button"
    className="asset-preview asset-preview-button"
    aria-label={`预览 ${asset.filename}`}
    onClick={() => onPreview?.(asset)}
  >
    <img src={asset.url} alt="" loading="lazy" />
    <span className="asset-preview-hint" aria-hidden="true"><Eye size={14} /></span>
  </button>
)}
```

- [x] **Step 4: Run the focused tests and require GREEN**

Run: `npm test -- src/components/AssetWorkspace.test.tsx`

Expected: PASS, with Enter/Space handled by native controls and no duplicate image accessible name inside the labelled preview button.

### Task 3: Implement responsive visual differentiation

**Files:**
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `.asset-grid.view-list`, `.asset-grid.view-detail`, `.asset-preview-button`, and existing asset-card descendants.
- Produces: compact gallery, horizontal list rows, larger detail cards, and visible keyboard focus with no narrow-screen overflow.

- [x] **Step 1: Add button reset and focus-visible treatment**

```css
.asset-preview-button {
  width: 100%;
  padding: 0;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: inherit;
  appearance: none;
  cursor: pointer;
}

.asset-preview-button:focus-visible {
  z-index: 1;
  outline: 3px solid var(--accent-focus);
  outline-offset: -4px;
}

.asset-checkbox:focus-within { opacity: 1; }

.asset-checkbox input:focus-visible {
  outline: 3px solid var(--accent-focus);
  outline-offset: 2px;
}
```

- [x] **Step 2: Make list and detail layouts visibly distinct**

```css
.asset-grid.view-list { grid-template-columns: minmax(0, 1fr); }
.asset-grid.view-list .asset-card {
  display: grid;
  grid-template-columns: clamp(112px, 16vw, 168px) minmax(0, 1fr) auto;
  align-items: stretch;
}
.asset-grid.view-list .asset-preview { aspect-ratio: 4 / 3; min-height: 112px; }
.asset-grid.view-detail { grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
.asset-grid.view-detail .asset-preview { aspect-ratio: 16 / 10; }
```

- [x] **Step 3: Add responsive list fallbacks**

```css
@media (max-width: 768px) {
  .asset-grid.view-list { grid-template-columns: minmax(0, 1fr); }
  .asset-grid.view-list .asset-card {
    grid-template-columns: clamp(104px, 24vw, 144px) minmax(0, 1fr);
  }
  .asset-grid.view-list .asset-preview { min-height: 104px; }
  .asset-grid.view-list .asset-actions {
    grid-column: 1 / -1;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .asset-grid { grid-template-columns: minmax(0, 1fr); }
  .asset-grid.view-list,
  .asset-grid.view-detail { grid-template-columns: minmax(0, 1fr); }
  .asset-grid.view-list .asset-card { grid-template-columns: 104px minmax(0, 1fr); }
  .asset-grid.view-list .asset-preview {
    min-height: 104px;
    max-height: 112px;
    aspect-ratio: 1;
  }
  .asset-grid.view-list .asset-actions { grid-column: 1 / -1; }
  .asset-grid.view-detail .asset-preview { aspect-ratio: 1; }
  .asset-batch-actions { flex: 1 1 100%; flex-wrap: wrap; width: 100%; }
}
```

- [x] **Step 4: Re-run the focused suite and static gates**

Run: `npm test -- src/components/AssetWorkspace.test.tsx && npm run lint && npm run build`

Expected: all commands exit 0 with no new warning or budget regression.

### Task 4: Review, publish, and accept the exact production build

**Files:**
- Stage only `src/components/AssetWorkspace.tsx`, `src/components/AssetWorkspace.test.tsx`, `src/App.css`, this design document, and this plan.

**Interfaces:**
- Consumes: the repository release workflow and production smoke script.
- Produces: one reviewed implementation commit on `main`, matching remote/CI/deployment evidence, cleaned production QA state, and a final release-evidence record.

- [x] **Step 1: Run the complete local release gate**

Run the full unit suite, function typecheck, lint, production build/budget, dependency audit, install-script audit, secret scan, production-secret verifier, remote D1 migration check, and staged-diff hygiene checks. Every command must exit 0.

- [x] **Step 2: Perform independent read-only code review**

Review the exact diff for requirements coverage, event semantics, nested-interactive controls, responsive CSS precedence, regression risk, and accidental scope. Resolve verified findings and rerun affected gates.

Reviewer follow-up must prove that desktop list thumbnails stay bounded, the Shift-click regression spans at least three assets, video controls are not nested in a button, mobile detail previews are taller than mobile grid previews, and both per-card and multi-selection actions remain inside a 390 px viewport.

- [x] **Step 3: Stage, commit, and push explicitly**

```powershell
git add -- src/App.css src/components/AssetWorkspace.tsx src/components/AssetWorkspace.test.tsx docs/superpowers/specs/2026-07-13-asset-library-view-modes-design.md docs/superpowers/plans/2026-07-13-asset-library-view-modes.md
git diff --cached --check
git commit -m "fix: complete asset library view modes"
git push origin main
```

Confirm `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` are identical.

- [x] **Step 4: Match CI, deployment, smoke, and browser evidence to the implementation commit**

Require successful GitHub Actions and a Cloudflare Pages production deployment whose source SHA equals the implementation commit. Run `npm run smoke:production` with `CSTD_COMMIT_SHA` set only in-process. On the exact deployment URL, upload one disposable real image and verify desktop grid/list/detail computed layouts, toggle/group roles, keyboard preview, keyboard selection, console cleanliness, and mobile 390 x 844 overflow/layout. Delete the disposable asset and close the browser session.

- [x] **Step 5: Close hygiene and update evidence**

Remove untracked Playwright internals while preserving only intentionally reported screenshots, verify production has no disposable asset, require a clean `main...origin/main` worktree, and mark every completed plan checkbox.

## Execution Evidence

- Implementation commit: `e4d9fd0f33cb52ba6dbfd3b8f7d360c1373ce234` (`fix: complete asset library view modes`). Local `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` matched before release acceptance.
- Local release gate: 88 Vitest files / 557 tests plus 8 production-smoke unit tests passed; Functions typecheck, ESLint, production build/budget, dependency audit, install-script audit, production-secret verification, release-scope and 402-commit secret scans, and remote D1 migration check passed.
- Independent review: follow-up verdict had no Critical or Important findings after the mobile-detail size assertion and exactly-one-pressed regression were added.
- GitHub Actions: run `29210329457` completed successfully for the implementation SHA, including deploy and production verification.
- Cloudflare Pages: production deployment `10b3142c-83df-434d-a38d-4e414fa9aee9` at `https://10b3142c.cstd-design.pages.dev` reported source `e4d9fd0`; exact-SHA and `https://design.custard.top` production smoke both passed.
- Live browser acceptance: a disposable real PNG was uploaded through the production UI. Desktop rendered grid/list/detail as 4/1/3 columns with a 126 px list thumbnail. At 390 x 844, grid used one column, list used `104px 237.333px`, and detail preview height was 341.33 px versus grid 256 px. Keyboard preview and checkbox selection passed, every checked layout had no horizontal overflow, and the browser recorded zero warnings/errors.
- Cleanup: the disposable production asset was deleted and absence rechecked; the production browser, local Pages process, `output/`, and `.playwright-cli/` artifacts were removed.
