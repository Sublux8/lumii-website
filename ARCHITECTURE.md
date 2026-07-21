# Architecture

Phase 0 foundation for the Lumii marketing site, knowledge hub, and (later)
access-request platform. This documents the load-bearing decisions; the README
covers day-to-day commands and the Needs-Garth runbook.

## Stack

- **Astro 6** (`output: "static"`), TypeScript, **MDX** content collections.
- **Tailwind v4** via the **PostCSS** plugin (`postcss.config.mjs`), tokens
  exposed through `@theme inline` in `src/styles/global.css`.
- **Node ≥ 22.12** (`.nvmrc` = 22.12.0).
- Hosting target **Cloudflare** (Workers static assets; Pages is an acceptable
  fallback). See README → Hosting.

### Known stack notes (Astro 6 / rolldown)

Astro 6 ships the rolldown bundler, which currently breaks two things; both are
worked around, not hacked:

1. **`@tailwindcss/vite` is incompatible** with rolldown's resolve hook
   (`Missing field tsconfigPaths`). → We use `@tailwindcss/postcss` instead.
2. **`@astrojs/cloudflare` adapter** fails to bundle under rolldown in this
   environment (`require_dist is not a function`). → Phase 0 is 100% static and
   needs **no adapter**; it's added in Phase 2 with the on-demand signup
   endpoint. The adapter is in `package.json` already, ready to wire.

## Directory layout

```
src/
  styles/        tokens.css (canonical) + global.css (Tailwind + @theme + base)
  i18n/          config.ts (locale registry) · index.ts (t() + Intl) · locales/
  content.config.ts   sectors + knowledge collections (Zod schemas)
  content/       sectors/*.mdx · knowledge/*.mdx
  components/    primitives/* · sections/*   (every page is assembled from these)
  layouts/       BaseLayout.astro (head/SEO/chrome)
  lib/           seo.ts (hreflang/canonical) · analytics.ts · errors.ts
  pages/
    [locale]/    every page, locale-prefixed via getStaticPaths
    404.astro    (root)
  middleware.ts  nonce CSP + security headers for on-demand routes / dev
public/
  _headers _redirects robots.txt favicon.svg
  .well-known/security.txt
  scripts/       theme-init.js · theme-toggle.js (external, CSP-safe)
  admin/         Sveltia CMS (config.yml + index.html) — config only
scripts/         link-check.mjs · axe-check.mjs
.github/         workflows/ci.yml · dependabot.yml
```

## i18n (§4)

We **own** locale routing rather than using Astro's built-in i18n router (which
does not move physical file routes under a prefix and collided with our pages).
Every page lives under `src/pages/[locale]/` and calls `getStaticPaths()` →
`localeStaticPaths()`, generating one build per locale.

- **Registry:** `src/i18n/config.ts`. A `Locale` separates `language` ("en")
  from `region` ("AU") — **region ≠ language**. `active: false` locales (en-US,
  en-GB) are **reserved**: routes build, but they render the default catalogue
  (graceful fallback — "missing translation → default, not 404"). Flip `active`
  + add a catalogue to launch one.
- **Strings:** every user-facing string is in `src/i18n/locales/en-au.ts`.
  Components never hardcode copy. `useTranslations(locale)` returns a typed `t()`
  that falls back to the default catalogue per key.
- **Intl:** `formatDate/Number/Currency` are locale-aware (no hardcoded formats).
- **SEO:** `src/lib/seo.ts` emits canonical + hreflang (active locales + the
  `x-default`) per page; `@astrojs/sitemap` produces the sitemap.
- **RTL-ready:** all CSS uses **logical properties** (`margin-inline`,
  `padding-block`, `inset-*`, `text-align: start`) — never physical left/right.

## Content model (§5)

`src/content.config.ts` defines two collections; both are the data layer that
drives the UI:

- **`sectors`** — drives the "Who it's for" nav and `/sectors` pages
  automatically. `status: published | draft | reserved`. Published → live + in
  nav + indexed; draft → built but noindex; reserved → schema-valid placeholder,
  not routed. Populated: Allied Health, General Practice (published); Academic &
  Research, Public Health (reserved).
- **`knowledge`** — taxonomy spans `clinician | practice-owner | patient |
  researcher | public`, deliberately broader than clinician-only.

**Reserved future surfaces** (NOT built this phase): the `docs.` / `api.` /
`research.` subdomains. Reserve the DNS/hosts; don't scaffold pages yet.

## Security (§15)

Posture: **cookieless, zero third-party scripts, zero inline scripts/styles.**
Astro is configured `inlineStylesheets: "never"`, all JS is external + same
origin (`/scripts/*.js`), so the static CSP is `script-src 'self'; style-src
'self'` — the strongest, most static-friendly policy, needing no nonce/hash.

Two enforcement paths, kept equivalent:

- **Static pages** → `public/_headers` (the production policy): HSTS preload,
  CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` locking
  camera/mic/geo/payment, `frame-ancestors 'none'`, COOP/CORP.
- **On-demand routes + `astro dev`** → `src/middleware.ts` sets the same headers
  with a **per-request nonce** CSP (`'nonce-…'`). This is the directive's
  nonce-based CSP, applied where nonces actually make sense (dynamic responses).
  Prerendered pages don't run middleware on Cloudflare, hence the `_headers`
  policy is authoritative for them.

`/admin/*` (Sveltia) carries its own relaxed CSP so the CMS tool can load from a
CDN and talk to GitHub without weakening the marketing site. `security.txt` →
`security@lumii.com.au`.

## Analytics & errors (§16/§17)

Both privacy-first and **swappable** behind a thin interface:

- **`src/lib/analytics.ts`** — `track(event)` posts same-origin (sendBeacon →
  `/api/events`, wired Phase 2), cookieless, never blocks the page. Page views
  are measured server-side by Cloudflare Web Analytics (no beacon script, so the
  CSP stays `'self'`). The **event taxonomy** is the typed `AnalyticsEvent`
  union: `page_view`, `cta_click`, `signup_started`, `signup_completed`
  (conversion), `download` (by OS/version), `outbound_click`.
- **`src/lib/errors.ts`** — Sentry interface, env-gated on `PUBLIC_SENTRY_DSN`.
  The SDK is intentionally not yet a dependency (lean bundle); `connect-src`
  already allows `*.ingest.sentry.io`. Activate by installing `@sentry/browser`
  and filling the two stubs.

## CI (§19)

`.github/workflows/ci.yml`: install → format:check → lint → typecheck → build →
link-check → Lighthouse (perf budgets + a11y/SEO gates) → axe → deploy preview.
Every gate blocks merge once branch protection requires the `quality` job.
Renovate (npm) + Dependabot (Actions) keep deps current without overlap.
