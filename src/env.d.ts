/// <reference path="../.astro/types.d.ts" />

/**
 * Worker bindings for the on-demand route. Astro v6 removed
 * `Astro.locals.runtime.env`; the adapter exposes bindings through the workerd
 * built-in module `cloudflare:workers` instead. Non-secret values come from
 * wrangler.jsonc `vars`; the three secrets are set with `wrangler secret put`
 * (prod) / `.dev.vars` (local). The service-role key bypasses Supabase RLS —
 * server-only, never the client.
 *
 * No package ships a `cloudflare:workers` type declaration (we don't depend on
 * @cloudflare/workers-types), so we declare the module's `env` export ourselves;
 * workerd provides the real binding at runtime in dev and production alike.
 */
interface CloudflareEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly TURNSTILE_SECRET_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly TEAM_NOTIFY_EMAIL: string;
  /** Optional override for the Resend "from" identity; defaults in the endpoint. */
  readonly RESEND_FROM?: string;
}

declare module "cloudflare:workers" {
  export const env: CloudflareEnv;
}

declare namespace App {
  // Merges with the adapter-injected `Locals extends Runtime` (adds `cfContext`).
  interface Locals {
    /** Per-request CSP nonce set by src/middleware.ts (on-demand routes). */
    cspNonce: string;
  }
}

interface ImportMetaEnv {
  /** Cloudflare Turnstile SITE key — public by design, inlined into the form. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  /** Public, cookieless. Empty disables the beacon (server-side CF analytics still works). */
  readonly PUBLIC_CF_ANALYTICS_TOKEN?: string;
  /** Public by design. Empty disables client error reporting. */
  readonly PUBLIC_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
