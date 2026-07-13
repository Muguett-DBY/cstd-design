# Upload Box Interaction Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make upload cancellation reliably operable, expose real progress semantics, and allow immediate re-selection of the same file without changing the upload API or visual language.

**Architecture:** `UploadBox` keeps ownership of validation, XHR progress, and abort state. Its render tree separates the native file trigger, hidden input, active status, cancel action, and progressbar so no interactive control is nested or disabled by an ancestor; focused component tests control only the browser XHR boundary.

**Tech Stack:** React 19, TypeScript, Testing Library, user-event, Vitest, XMLHttpRequest, CSS, Vite, Cloudflare Pages, Playwright CLI.

## Global Constraints

- Work directly on `main`; do not create a branch, force push, or use `git add .`.
- Preserve `/api/uploads`, accepted MIME types, 50 MB file limit, four-file limit, drag/drop behavior, notices, progress calculation, asset refresh, and success summary. Expose cancellation only while the XHR can still abort the upload.
- Do not add dependencies, routes, backend changes, storage changes, or persisted state.
- Reuse current design tokens, icons, upload dimensions, progress styling, dark-theme surfaces, and focus-ring conventions.
- Production evidence must be tied to the exact pushed commit SHA, and disposable production assets must be removed after verification.

---

### Task 1: Establish upload interaction and retry regressions

**Files:**
- Create: `src/components/UploadBox.test.tsx`
- Modify: `src/components/UploadBox.tsx`

**Interfaces:**
- Consumes: existing `UploadBox({ onUploaded, onNotice })` props and browser `XMLHttpRequest` events.
- Produces: one idle/success upload trigger, a sibling hidden file input, an active status, an independent cancel button, and an accessible progressbar.

- [x] **Step 1: Add a controlled XHR boundary and failing structure/retry tests**

```tsx
class ControlledXMLHttpRequest {
  static instances: ControlledXMLHttpRequest[] = [];
  readonly upload = new EventTarget();
  private readonly events = new EventTarget();
  status = 0;
  response: unknown = null;
  responseType = "";
  open = vi.fn();
  send = vi.fn();
  abort = vi.fn(() => this.events.dispatchEvent(new Event("abort")));

  constructor() { ControlledXMLHttpRequest.instances.push(this); }
  addEventListener(type: string, listener: EventListener) { this.events.addEventListener(type, listener); }
  progress(loaded: number, total: number) {
    this.upload.dispatchEvent(new ProgressEvent("progress", { lengthComputable: true, loaded, total }));
  }
  succeed(response = { assets: [{ id: "asset-1" }] }) {
    this.status = 200;
    this.response = response;
    this.events.dispatchEvent(new Event("load"));
  }
}

test("keeps the hidden input outside the native upload trigger and resets it", async () => {
  const user = userEvent.setup();
  const { container } = render(<UploadBox onUploaded={vi.fn()} onNotice={vi.fn()} />);
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const trigger = screen.getByRole("button", { name: "上传参考图/视频" });
  expect(trigger.contains(input)).toBe(false);
  await user.upload(input, new File(["pixels"], "repeat.png", { type: "image/png" }));
  expect(input.value).toBe("");
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/UploadBox.test.tsx`

Expected: FAIL because the hidden input is inside the upload button and retains the selected fake path.

- [x] **Step 3: Add failing progress and cancellation tests**

```tsx
test("exposes progress and an independent working cancel action", async () => {
  const user = userEvent.setup();
  const onUploaded = vi.fn();
  const onNotice = vi.fn();
  const { container } = render(<UploadBox onUploaded={onUploaded} onNotice={onNotice} />);
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, new File(["pixels"], "cancel.png", { type: "image/png" }));
  const request = ControlledXMLHttpRequest.instances[0];
  request.progress(1, 2);
  const progress = await screen.findByRole("progressbar", { name: "上传进度" });
  expect(progress.getAttribute("aria-valuenow")).toBe("50");
  const cancel = screen.getByRole("button", { name: "取消上传" });
  expect(cancel.parentElement?.closest("button")).toBeNull();
  await user.click(cancel);
  await waitFor(() => expect(onNotice).toHaveBeenCalledWith("上传已取消。"));
  expect(request.abort).toHaveBeenCalledOnce();
  expect(onUploaded).not.toHaveBeenCalled();
});
```

- [x] **Step 4: Run the focused test and verify RED**

Run: `npm test -- src/components/UploadBox.test.tsx`

Expected: FAIL because the visual bar has no progressbar semantics and the cancel button is nested inside a disabled button.

### Task 2: Implement native trigger, active status, cancellation, and reset

**Files:**
- Modify: `src/components/UploadBox.tsx`
- Modify: `src/App.css`
- Test: `src/components/UploadBox.test.tsx`

**Interfaces:**
- Consumes: `uploading`, `progress`, `showSummary`, `uploadedCount`, `inputRef`, `processFiles`, and `cancelUpload`.
- Produces: `.upload-box-trigger`, `.upload-status`, an abortable cancel action, a non-cancelable post-commit refresh state, and the progressbar ARIA contract without API changes.

- [x] **Step 1: Separate idle and active DOM states**

```tsx
{uploading ? (
  <div className="upload-box uploading">
    <span className="upload-status" role="status" aria-live="polite">
      <RefreshCw size={18} className="spin" />
      <span>上传中... {progress}%</span>
    </span>
    <button type="button" className="upload-cancel-btn" onClick={cancelUpload} aria-label="取消上传" title="取消上传">
      <X size={14} />
    </button>
  </div>
) : (
  <button type="button" className={`upload-box upload-box-trigger${dragging ? " drag-over" : ""}`} onClick={() => inputRef.current?.click()}>
    {showSummary ? <><Check size={18} className="upload-success-icon" /><span>{uploadedCount} 个文件已上传</span></> : <><Upload size={18} /><span>{dragging ? "松开以上传" : "上传参考图/视频"}</span></>}
  </button>
)}
```

Retain the existing drag event handlers on the trigger button.

- [x] **Step 2: Move and reset the file input, then expose progress semantics**

```tsx
<input
  ref={inputRef}
  hidden
  type="file"
  accept={ALLOWED_TYPES.join(",")}
  multiple
  onChange={(event) => {
    void processFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  }}
/>
{uploading && (
  <div className="upload-progress-bar" role="progressbar" aria-label="上传进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${progress}%`}>
    <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
  </div>
)}
```

- [x] **Step 3: Preserve styling for the split structure**

```css
.upload-box-trigger:hover:not(:disabled) {
  border-color: var(--accent-strong);
  box-shadow: 0 2px 12px rgba(212, 137, 28, 0.1);
}

.upload-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

Replace the generic `.upload-box:hover:not(:disabled)` selector so the non-interactive active status does not gain hover affordance.

After `uploadWithProgress` resolves, clear `abortRef`, switch the status to `上传完成，正在刷新素材...`, keep progress at `100`, and remove the cancel button until `onUploaded` finishes. This keeps the action aligned with the actual XHR lifecycle.

- [x] **Step 4: Run focused tests and require GREEN**

Run: `npm test -- src/components/UploadBox.test.tsx`

Expected: all upload structure, retry, progress, cancellation, success, and existing production-smoke tests pass with zero failures.

### Task 3: Review, publish, and accept the exact production build

**Files:**
- Stage only `src/components/UploadBox.tsx`, `src/components/UploadBox.test.tsx`, `src/App.css`, this specification, and this plan.

**Interfaces:**
- Consumes: repository release workflow, production smoke harness, and existing authenticated upload endpoint.
- Produces: one reviewed `main` implementation commit, matching remote/CI/Pages evidence, and cleaned QA state.

- [x] **Step 1: Run local browser acceptance**

Build and serve `dist` through `wrangler pages dev`. In Chrome, delay `/api/uploads`, choose a real PNG, verify progress and a focusable independent cancel button, cancel without creating an asset, then retry the same filename and complete it. Repeat layout checks at 1440 x 1000 and 390 x 844; require zero console warnings/errors and no horizontal overflow.

- [x] **Step 2: Run independent review and the complete release gate**

Review the exact diff for nested interaction, XHR lifecycle (including the post-commit refresh window), input reset timing, event propagation, progress semantics, responsive styling, test-double fidelity, and accidental scope. Resolve verified findings. Run full tests, Functions typecheck, lint, production build/budget, dependency audit, install-script audit, release-scope/history/staged-diff secret scans, production-secret verification, remote D1 migration check, and diff hygiene.

- [x] **Step 3: Stage, commit, and push explicitly**

```powershell
git add -- src/components/UploadBox.tsx src/components/UploadBox.test.tsx src/App.css docs/superpowers/specs/2026-07-13-upload-box-interaction-reliability-design.md docs/superpowers/plans/2026-07-13-upload-box-interaction-reliability.md
git diff --cached --check
git commit -m "fix: make upload cancellation reliable"
git push origin main
```

Confirm local `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` match.

- [x] **Step 4: Match CI, deployment, production retry, and cleanup to the SHA**

Require successful GitHub Actions and a Cloudflare production deployment whose source SHA matches the implementation commit. Run exact-SHA and custom-domain production smoke. On the exact deployment, upload a disposable real PNG through the UI, verify same-file re-selection and the finished asset, test desktop/mobile upload-control layout and semantics, then delete every asset with the exact QA filename and recheck absence. Close the browser and remove Playwright artifacts.

## Pre-release evidence (2026-07-13)

- RED evidence: the first focused run proved the hidden input was nested and retained `C:\\fakepath\\repeat.png`, exposed no progressbar, and emitted React's nested-button hydration warning. A later lifecycle regression test also failed while the post-commit refresh window still exposed a non-functional cancel action.
- GREEN evidence: `npm test -- src/components/UploadBox.test.tsx` passed all four focused tests plus the eight production-smoke harness tests after the interaction and finalization fixes.
- Independent diff review covered invalid nesting, abort timing, input reset timing, drag/drop preservation, ARIA semantics, responsive selectors, the XHR test boundary, and changed-file scope. It found and resolved the post-commit cancellation race before release.
- Final local gate passed: `npm test` reported 89 files / 561 tests; Functions typecheck, ESLint, production build and chunk budget, production-secret verification, remote D1 migration check, dependency audit, install-script audit, release-scope scan, staged-diff scan, 404-commit history scan, and diff hygiene all passed.
- Production-like local Pages acceptance passed at 1440 x 1000 and 390 x 844: the active container was a `DIV`; cancel had no button ancestor; the input had no button ancestor and reset after each selection; cancel aborted attempt one; the exact same filename started attempt two; post-commit refresh exposed 100% progress with no cancel; idle/success used a native button; all mobile states stayed within the viewport with no horizontal overflow; browser console errors/warnings were zero.

## Release evidence (2026-07-13)

- Implementation commit `26e6defc53e1724e19ed5514bd36e7fd1d8f00cc` was pushed directly to `main`; local `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` matched that SHA.
- GitHub Actions run `29231575004` completed successfully. Secret scan, install, full tests, Functions typecheck, lint, production build, production-secret verification, D1 migration check, Pages deployment, and deployment verification all passed.
- Cloudflare Pages production deployment `6061c5d5-5c2a-47c7-ba68-6536d11d9d63` published source `26e6def` at `https://6061c5d5.cstd-design.pages.dev`. Exact-deployment and `https://design.custard.top` production smoke both verified the full commit SHA, anonymous session boundary, authenticated-route boundary, and disabled production E2E bypass.
- Headed Chromium production acceptance on the exact deployment passed after the CLI transport was found to close while an upload route was intentionally held. The same locked Playwright version verified a real browser flow: attempt one was cancelled by keyboard without persisting an asset; re-selecting the same filename produced request two and one persisted asset; finalization held progress at 100% and removed cancel; the asset appeared in Assets; desktop and 390 x 844 mobile controls had valid native semantics and no horizontal overflow; console warnings/errors and page errors were zero.
- The disposable asset `qa-upload-box-26e6def.png` was deleted after verification, an independent API lookup confirmed zero matching assets, and the short-lived QA authentication session was logged out with HTTP 200.
