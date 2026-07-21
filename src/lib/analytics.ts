/**
 * §16 Analytics — privacy-first, cookieless, provider-swappable.
 *
 * Design constraints that shaped this:
 *  - No third-party script (keeps the CSP `script-src 'self'`). Page views are
 *    measured server-side by Cloudflare Web Analytics (automatic when the zone
 *    is proxied — no beacon needed). Custom events POST same-origin to our own
 *    Worker sink (`/api/events`, wired in a later phase), so `connect-src 'self'`
 *    covers them.
 *  - Cookieless: we never set or read a cookie or persistent identifier.
 *  - Swappable: everything goes through `track()`. Changing providers is editing
 *    `dispatch()` only — call sites never change.
 *
 * EVENT TAXONOMY (§16). The canonical list. Conversion = `signup_completed`
 * (a test-group access request). Keep names snake_case and stable; analytics
 * dashboards key off them.
 */
export type AnalyticsEvent =
  | { name: "page_view"; props: { path: string; locale: string } }
  | { name: "cta_click"; props: { id: string; location: string; locale: string } }
  | { name: "signup_started"; props: { source: string; locale: string } }
  | { name: "signup_completed"; props: { discipline?: string; locale: string } }
  | {
      name: "download";
      props: {
        os: "macos" | "ios" | "ipados" | "unknown";
        version?: string;
        locale: string;
      };
    }
  | { name: "outbound_click"; props: { href: string; locale: string } };

const ENDPOINT = "/api/events";

/** Fire-and-forget. Never throws, never blocks UI, never awaited by callers. */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  try {
    dispatch(event);
  } catch {
    /* analytics must never break the page */
  }
}

function dispatch(event: AnalyticsEvent): void {
  const payload = JSON.stringify({ ...event, ts: Date.now() });

  // sendBeacon survives page unloads (important for cta/outbound clicks).
  if (navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
    return;
  }
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  });
}
