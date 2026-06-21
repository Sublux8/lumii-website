/**
 * §17 Error tracking — Sentry by default, swappable.
 *
 * Wired as hooks, not yet activated: `@sentry/browser` is intentionally NOT a
 * dependency yet (keeps the Phase-0 bundle lean and avoids shipping an SDK with
 * no DSN). When Garth provisions a Sentry project, install the SDK and replace
 * the body of `initErrorTracking()` / `captureError()` — call sites and the CSP
 * `connect-src *.ingest.sentry.io` allowance already account for it.
 *
 * Activation is env-gated on PUBLIC_SENTRY_DSN so a missing DSN is a silent
 * no-op rather than a runtime error.
 */
const DSN = import.meta.env.PUBLIC_SENTRY_DSN;

export function initErrorTracking(): void {
  if (typeof window === "undefined" || !DSN) return;
  // PHASE 2: import("@sentry/browser").then((Sentry) => Sentry.init({ dsn: DSN, ... }))
  // Until then this is a deliberate no-op so the hook exists at every call site.
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!DSN) {
    if (import.meta.env.DEV) console.error("[errors]", error, context);
    return;
  }
  // PHASE 2: Sentry.captureException(error, { extra: context })
}
