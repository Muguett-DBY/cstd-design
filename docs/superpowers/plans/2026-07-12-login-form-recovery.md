# Login Form Recovery and Password Manager Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the private-access login form explicit to people, assistive technology, and password managers, while making failed submissions easy to recover from.

**Architecture:** `LoginPage` keeps local password/loading/error state and the existing asynchronous `onLogin` boundary. Stable input and error identifiers connect native form semantics to a live error alert; the input change handler clears stale error state, while a current-value reference prevents an older in-flight failure from invalidating an edited password. The API request helper gains an explicit unauthorized-response policy so login can preserve its server error while protected requests retain global session-expiry handling.

**Tech Stack:** React 19, TypeScript, Testing Library, user-event, Vitest, Vite, Cloudflare Pages.

## Global Constraints

- Work directly on `main`; do not create a branch or use `git add .`.
- Preserve the `LoginPage` public API and authentication/session behavior.
- Do not add dependencies or change backend, storage schema, rate limits, secrets, or deployment configuration.
- Production evidence must be tied to the exact pushed commit SHA.

---

### Task 1: Specify explicit password-field semantics

**Files:**
- Create: `src/components/LoginPage.test.tsx`
- Modify: `src/components/LoginPage.tsx`
- Modify: `src/App.css`

- [x] Add a focused test requiring a visible `访问密码` label, stable input id/name, password type, `current-password` autocomplete token, and native required state.
- [x] Run the focused test and capture the expected RED result against the current placeholder-only field.
- [x] Add the label and form metadata, then make the labelled field visually coherent with the login card.
- [x] Run the focused test and require GREEN.

### Task 2: Specify and implement failed-login recovery

**Files:**
- Modify: `src/components/LoginPage.test.tsx`
- Modify: `src/components/LoginPage.tsx`

- [x] Add a test that rejects `onLogin`, requires a live alert plus `aria-invalid`/`aria-describedby`, then edits the field and requires stale error state to disappear.
- [x] Run the focused test and capture the expected RED result.
- [x] Link the error to the password field, expose it as an alert, and clear it on user edits.
- [x] Run the focused test and require GREEN.
- [x] Add a RED/GREEN regression proving a failed in-flight request cannot mark an edited password invalid.

### Task 3: Preserve the login endpoint's specific unauthorized error

**Files:**
- Create: `src/api.test.ts`
- Modify: `src/api.ts`

- [x] Add a failing public-API test requiring `api.login` to surface `密码不正确。` without broadcasting a global unauthorized event.
- [x] Add a characterization guard requiring protected-resource `401` responses to keep broadcasting and use `请先登录。`.
- [x] Run the focused API test and capture the expected RED result.
- [x] Add an explicit unauthorized-response policy to `requestJson` and select response passthrough only for `api.login`.
- [x] Run both focused login/API test files and require GREEN.

### Task 4: Verify, review, publish, and accept production

**Files:**
- Stage only the login component/API client, their focused tests, login styles, this design/plan, and any explicit status correction made to the preceding completed plan.

- [x] Run the complete local gate: full tests, function typecheck, lint, build, dependency audit, install-script audit, secret scan, production-secret check, remote migration check, and diff hygiene scans.
- [x] Verify the built unauthenticated login page in a real desktop/mobile browser, including accessible metadata, layout, native validation, error recovery, and console cleanliness.
- [x] Request an independent read-only code review and resolve the verified in-flight error race and field/error-linkage test gap.
- [ ] Stage explicitly, commit on `main`, push, and confirm local/remote SHA equality.
- [ ] Match that exact SHA to successful GitHub Actions and Cloudflare production deployment records, then run exact-SHA production smoke.
- [ ] Verify the exact production deployment in a fresh browser, authenticate without exposing the secret, confirm API health and alias asset parity, and leave the worktree clean.
