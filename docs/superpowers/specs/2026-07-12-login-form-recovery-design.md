# Login Form Recovery and Password Manager Semantics Design

## Context

The private-access login screen is the first interaction for every new browser session. Its only password input currently relies on placeholder text, has no stable field name, and omits the password-manager autocomplete token. Failed submissions render visible text, but that message is not announced or associated with the field, and it remains stale while the user corrects the password. Production browser QA also reports the missing autocomplete metadata. Local end-to-end verification additionally proved that the API client rewrites the login endpoint's specific `401` response (`密码不正确。`) to the protected-resource message `请先登录。` and broadcasts a session-expired event even though no session exists yet.

## Decision

Harden the existing login form without changing authentication or session behavior. Give the password field a visible label and stable form identity, identify it as the current password for password managers, associate failed submissions with the field and an alert, and clear stale failure state as soon as the user edits the value. If the value changes while a request is pending, ignore that request's eventual failure for field-validation purposes. Let the login request preserve the backend's specific `401` error without broadcasting the global unauthorized event; protected-resource `401` responses keep the existing session-expiry behavior.

Alternatives considered:

- Add only `autocomplete="current-password"`. Rejected because it removes the browser diagnostic but leaves the same labelling and recovery gaps.
- Replace the password gate with a broader authentication flow or shared form framework. Deferred because it changes product and backend scope without evidence that the current single-password access model is wrong.

## Interaction Contract

- The password field is reachable by the visible label `访问密码` and keeps its existing autofocus behavior.
- The field has stable `id="login-password"` and `name="password"` values, `type="password"`, `autocomplete="current-password"`, and native `required` validation.
- Before a failed submission, the field is not marked invalid and has no error description.
- A rejected login displays exactly one live alert, marks the password field invalid, and links the field to that alert with `aria-describedby="login-error"`.
- An incorrect password displays the backend's specific recovery message and does not announce a global session expiration.
- A `401` from an authenticated/protected API still broadcasts the unauthorized event and uses the generic `请先登录。` message.
- Editing the password after a rejection immediately removes the stale alert and the invalid/error linkage.
- Editing the password while a request is pending prevents that request's later failure from marking the edited value invalid.
- Loading, disabled-button, password submission, and successful-login behavior remain unchanged.

## Implementation Boundaries

- Change only `LoginPage`, its focused tests, the API client's unauthorized-response policy and focused API tests, and login-card styles, plus the design/plan documents.
- Keep the `LoginPage` public API and the `onLogin(password)` contract unchanged.
- Do not alter backend authentication APIs, password handling, rate limits, sessions, storage, dependencies, or deployment configuration.

## Verification

- Add regression tests for label association, password-manager metadata, native required state, failed-login alert semantics, field/error linkage, stale-error clearing (including edits while a request is pending), login-specific `401` passthrough, and protected-resource unauthorized broadcasts.
- Run the focused test file, full test suite, function typecheck, lint, production build and budget check, dependency/security gates, secret verification, remote migration check, and diff hygiene checks.
- Verify the unauthenticated built and exact production pages in a real browser, then authenticate on production and confirm application/API health without emitting the password.
