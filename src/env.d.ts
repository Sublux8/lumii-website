/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Per-request CSP nonce set by src/middleware.ts (on-demand routes). */
    cspNonce: string;
  }
}

interface ImportMetaEnv {
  /** Public, cookieless. Empty disables the beacon (server-side CF analytics still works). */
  readonly PUBLIC_CF_ANALYTICS_TOKEN?: string;
  /** Public by design. Empty disables client error reporting. */
  readonly PUBLIC_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
