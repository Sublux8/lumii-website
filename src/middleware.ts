import { defineMiddleware } from "astro:middleware";

/**
 * §15 Security headers for ON-DEMAND routes (the signup endpoint, dynamic OG,
 * and `astro dev`). Prerendered marketing pages are static assets and are
 * governed by public/_headers instead — middleware does not run for them on
 * Cloudflare. The two policies are kept equivalent; the only difference is that
 * this dynamic path uses a per-request NONCE (directive §15) while the static
 * path can rely on the stronger `'self'`-only allowance (no inline at all).
 *
 * The nonce is exposed on `Astro.locals.cspNonce` so any inline <script>/<style>
 * an on-demand page emits can carry `nonce={Astro.locals.cspNonce}`.
 */
function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

const CONNECT_SRC = [
  "'self'",
  "https://scqxaziehzyekohhiuip.supabase.co",
  "https://*.ingest.sentry.io",
  "https://*.ingest.us.sentry.io",
].join(" ");

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = makeNonce();
  context.locals.cspNonce = nonce;

  const response = await next();

  // Only decorate HTML documents; pass assets/redirects through untouched.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${CONNECT_SRC}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  const headers = response.headers;
  headers.set("Content-Security-Policy", csp);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  return response;
});
