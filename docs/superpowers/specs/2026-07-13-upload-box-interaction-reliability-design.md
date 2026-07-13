# Upload Box Interaction Reliability Design

## Context

The image workspace upload control currently renders one outer `<button>` around both a hidden file input and, while an upload is active, a second cancel `<button>`. The outer button is disabled during upload. This creates invalid nested interactive content and places the only cancellation action inside a disabled ancestor, so pointer and keyboard behavior is browser-dependent and the advertised cancel path can become unreachable.

The file input also retains its selected value after `change`. Browsers do not fire another `change` event when the user immediately chooses the same file again, which makes a common retry path silently do nothing after success, cancellation, or failure.

## Decision

Keep the existing upload appearance and XHR progress transport, but separate the interaction boundaries:

- When idle or showing the previous success summary, render one native upload trigger button. It owns click, drag-over, drag-leave, and drop behavior.
- Keep the hidden file input as a sibling of the trigger instead of a descendant. After copying its `FileList` into the upload flow, clear its value immediately so the same file can be chosen again.
- While uploading, replace the trigger with a non-interactive status container that preserves the same `.upload-box` dimensions and visual treatment.
- Put the live upload text in a polite `role="status"` span and render one independent native cancel button named `取消上传` beside it only while the XHR remains abortable.
- Once the server accepts the upload, clear the abort handle, replace the live text with `上传完成，正在刷新素材...`, and remove the cancel action while `onUploaded` refreshes the asset list. This prevents a post-commit control from promising an impossible rollback.
- Expose the existing visual progress bar as `role="progressbar"` named `上传进度`, with minimum `0`, maximum `100`, current percentage, and percentage value text.
- Preserve the current abort controller, validation, progress calculation, success summary, notices, asset refresh, drag/drop limits, accepted types, and 50 MB / four-file boundaries.

Alternatives considered:

- Convert the whole drop zone to a `div role="button"`. Rejected because it would replace reliable native button keyboard behavior with custom key handling.
- Wrap the control in a file-input `label`. Rejected because the active cancel button would still create competing interaction inside the label and make event routing fragile.
- Keep the disabled outer button and position a cancel sibling over it. Rejected because the upload state would still be represented by a disabled action instead of a status, and focus order would be less clear.

## DOM and Interaction Contract

- Idle/success state exposes exactly one button whose accessible name is its visible upload text (`上传参考图/视频` or `<n> 个文件已上传`).
- The file input is hidden, accepts the existing four MIME types, allows multiple files, and is not contained by any button.
- Abortable active state exposes no upload-trigger button. It exposes a polite status such as `上传中... 50%`, one button named `取消上传`, and one progressbar named `上传进度` whose `aria-valuenow` is `50`.
- The cancel button has no button ancestor. Activating it aborts the active XHR, announces `上传已取消。`, returns the control to idle, and does not call `onUploaded`.
- Post-commit refresh state exposes `上传完成，正在刷新素材...`, keeps progress at `100`, and exposes no cancel button because the uploaded asset can no longer be rolled back through XHR abort.
- Selecting a file clears the input value after the component captures the selected files. Selecting that same file again starts a new XHR without requiring a page refresh or a different filename.
- Successful uploads continue to call `onUploaded`, show the uploaded count, and announce `<n> 个文件上传成功。`.

## Visual and Responsive Constraints

- Reuse `.upload-area`, `.upload-box`, `.upload-cancel-btn`, the current icons, colors, border, radius, spacing, progress bar, dark-theme surfaces, and global focus ring.
- Add only structural selectors needed to distinguish the native trigger and inline status content.
- Keep the control full-width with the same minimum height on desktop and at 390 x 844. The status text, cancel button, and progress indicator must remain inside the workspace without horizontal overflow.

## Testing Strategy

- Add a focused Testing Library suite for `UploadBox` with a controlled `XMLHttpRequest` test double at the network boundary. The tests exercise the real component and React state; the double only supplies progress, success, and abort events that would otherwise require a live upload.
- Prove RED before implementation for the file input being nested in the trigger, retained file-input value, missing progress semantics, and cancel button inside a disabled button.
- Prove GREEN for sibling interaction structure, same-file re-selection, progress updates, independent cancellation, cancellation notice, no false `onUploaded` call, and removal of the cancel action once the XHR has committed.
- Run the full repository gates and use a production-like Pages runtime plus Chrome to verify idle, active progress, cancellation, same-file retry, desktop/mobile layout, console cleanliness, and no horizontal overflow.
- After deployment, use a disposable real PNG on the exact Pages deployment, verify a successful retry/upload path, delete every disposable asset by exact QA filename, and recheck absence.

## Implementation Boundaries

- Modify only `src/components/UploadBox.tsx`, `src/components/UploadBox.test.tsx`, upload-control CSS in `src/App.css`, this specification, and the matching implementation plan.
- Do not change upload API contracts, backend upload handling, file limits, accepted formats, image compression, asset persistence, authentication, dependencies, routes, or storage schemas.
