# Compatible Toolchain Refresh Design

## Goal

Refresh compatible runtime and quality-tool dependencies while limiting the only major change to Wrangler's resolver-required, type-only peer after validation, without weakening install-script controls or changing production behavior.

## Scope

- Update Wrangler from 4.107.1 to 4.110.0, update its optional Workers Types peer from 4.20260702.1 to 5.20260713.1, and align the explicit Linux `workerd` binary pin with Wrangler's exact `1.20260708.1` runtime dependency.
- Update ESLint from 10.6.0 to 10.7.0 and Lucide React from 1.23.0 to 1.24.0 within their existing major versions.
- Keep TypeScript 6; TypeScript 7 requires a separate compiler migration.
- Preserve the existing Pages no-telemetry posture. Wrangler's new dependency instrumentation is used only by Worker deploy/version uploads; the Pages validator rejects that Worker-only setting and the Pages upload path does not emit `package_dependencies`, so the Pages config must omit it.

## Guardrails

- A Node test derives the required `workerd` version from the installed Wrangler manifest and requires the root manifest, lockfile, Linux binary, and sole install-script approval to match it exactly.
- The same test requires `send_metrics = false` and forbids the unsupported Worker-only dependency-instrumentation section in this Pages configuration.
- Installation must introduce no unreviewed lifecycle scripts or high-severity audit findings.
- Full tests, Functions typecheck, lint, production build/budget, local Pages, browser acceptance, production binding checks, remote migration checks, secret scans, CI, exact Pages deployment, and custom-domain smoke remain release gates.

## Expected user impact

No intentional UI or API behavior change. Workers Types 5 removes legacy compatibility-date entrypoints that this project does not use; the root ambient type entrypoint remains the project's configured source. The benefit is a resolver-supported Cloudflare local/deploy toolchain, current lint fixes, current icon package, and an executable invariant that prevents future Wrangler/workerd drift while retaining valid Pages telemetry settings.
