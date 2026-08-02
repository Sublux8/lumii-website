# Lumii website

Marketing site, knowledge hub, and (later) access-request platform for
[Lumii](https://lumii.com.au) — the Australian multi-disciplinary practice
management platform. Astro 6 + Tailwind v4, deployed to Cloudflare, design
sourced from the Lumii macOS app's token layer (see `DESIGN-TOKENS.md`).

This is **Phase 0** — the expensive-to-retrofit foundation (design system, i18n,
content model, security headers, CI, analytics/error hooks). Pages/content come
in Phases 1–3.

## Quick start

```bash
nvm use            # Node 22.12+ (see .nvmrc)
npm ci
npm run dev        # http://localhost:4321  (/ is the en-AU homepage)
```

## Scripts

| Script               | Purpose                                              |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Dev server                                          |
| `npm run build`      | Static production build → `dist/`                   |
| `npm run preview`    | Serve the built `dist/` on :4321                    |
| `npm run typecheck`  | `astro check`                                        |
| `npm run lint`       | ESLint (flat config)                                |
| `npm run format`     | Prettier write · `format:check` to verify           |
| `npm run links`      | Broken internal-link / image check over `dist/`     |
| `npm run lhci`       | Lighthouse CI (perf budgets + a11y/SEO gates)       |
| `npm run a11y`       | axe-core accessibility pass                          |

## Architecture

See `ARCHITECTURE.md`. Highlights:

- **Design tokens** in `src/styles/tokens.css` (light + dark), traced to the app
  in `DESIGN-TOKENS.md`. Every page is assembled from `src/components/`
  primitives + sections — see the live gallery at `/components` (noindex).
- **i18n**: explicit `[...locale]` routing. The default locale (`en-au`) is
  UNPREFIXED and owns the root — `/`, `/pricing` — while `en-us`/`en-gb` are
  reserved and keep their segment (`/en-us/pricing`). `localeParam()` in
  `src/i18n/index.ts` is the single place that rule lives; every getStaticPaths
  goes through it. Strings externalised in `src/i18n/locales/`. RTL-ready
  (logical CSS).
- **Content**: `sectors` + `knowledge` collections drive nav and pages.
- **Security**: cookieless, no third-party scripts, strict CSP (`_headers` for
  static, nonce CSP in `middleware.ts` for on-demand). `security.txt` present.

### Known stack notes

Astro 6's rolldown bundler currently requires two workarounds (details in
`ARCHITECTURE.md`): Tailwind runs via **PostCSS** (not the Vite plugin), and the
Cloudflare **SSR adapter is deferred to Phase 2** (Phase 0 is fully static and
needs no adapter).

## Hosting

**Target: Cloudflare.** Phase 0 is 100% static, so it deploys as static assets to
either:

- **Cloudflare Workers (static assets)** — the chosen target. Deploy `dist/` via
  Wrangler with a `wrangler.toml` `[assets]` binding (added when the project is
  created on Garth's account — see Needs-Garth).
- **Cloudflare Pages** — acceptable fallback; `npx wrangler pages deploy dist`.
  `_headers` and `_redirects` work on both.

**When Phase 2 adds the signup endpoint** (on-demand), wire the SSR adapter:

```js
// astro.config.mjs
import cloudflare from "@astrojs/cloudflare";
export default defineConfig({
  output: "static",          // keep static; opt specific routes in
  adapter: cloudflare(),
  // mark the endpoint: `export const prerender = false`
});
```

Secrets live in Cloudflare (`wrangler secret put …`) and locally in `.dev.vars`
(gitignored — copy from `.dev.vars.example`). **No key is ever committed**, and
the Supabase service-role key is server-only.

---

## Needs Garth — external setup runbook

None of the below is provisioned (no access to Garth's accounts). Each is a
discrete, ordered task. Nothing here blocks local dev or the build.

### 1. GitHub repo + branch protection

1. Create `Sublux8/lumii-website` (empty, no README).
2. Push this repo (Claude has **not** pushed — confirm first):
   `git remote add origin git@github.com:Sublux8/lumii-website.git && git push -u origin main`
3. Create the `drafts` branch: `git branch drafts && git push -u origin drafts`.
4. Settings → Branches → protect `main`: require PRs, require the **CI →
   quality** status check, disallow direct pushes. (This is what keeps Sveltia
   off `main`.)

### 2. Cloudflare hosting

1. Create the Cloudflare project (Workers static assets, or Pages named
   `lumii-website`).
2. Add `lumii.com.au` to Cloudflare DNS. **Canonical = apex** (`lumii.com.au`);
   add a Redirect Rule `www.lumii.com.au/* → https://lumii.com.au/$1` (301).
   `_redirects` is the fallback if you use Pages.
3. Reserve hosts (DNS only, no sites yet): `download.lumii.com.au`,
   `mail.lumii.com.au`, and the future `docs.` / `api.` / `research.` subdomains.
4. **Cloudflare Web Analytics**: enable for the zone (Web Analytics → add site).
   With the zone proxied this is cookieless and needs **no beacon script** — do
   NOT add the JS snippet (it would break the `script-src 'self'` CSP).
5. Repo secrets for CI preview deploys: `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID` (Settings → Secrets → Actions).

### 3. Supabase (`access_requests`) — Phase 2 wiring, create now

Project ref `scqxaziehzyekohhiuip` (Sydney, ap-southeast-2). Create the table:

```sql
create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  clinic text,
  discipline text,
  message text,
  locale text not null default 'en-AU',
  source text
);
alter table public.access_requests enable row level security;
-- No client policies: inserts go through the Worker with the service-role key.
```

Put `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
in Cloudflare secrets (and `.dev.vars` locally). The service-role key is
server-only — never in the client bundle.

### 4. Sveltia CMS (config done; auth needed)

`public/admin/config.yml` is configured to write to the **`drafts`** branch with
editorial workflow. To enable editing:

1. Deploy a Sveltia OAuth relay (e.g. `sveltia-cms-auth` Cloudflare Worker) and
   register a **GitHub OAuth App** (callback = the relay URL).
2. Set `backend.base_url` (and `auth_endpoint` if non-default) in `config.yml`.
3. Confirm `main` branch protection (step 1.4) so the CMS can only land on
   `drafts`.

### 5. Sentry (optional, hooks ready)

Create a Sentry project, then: `npm i @sentry/browser`, fill the two stubs in
`src/lib/errors.ts`, and set `PUBLIC_SENTRY_DSN`. `connect-src` already allows
`*.ingest.sentry.io`.

### 6. Resend (Phase 2 — team notify)

For new-access-request notifications to `support@lumii.com.au`: create a Resend
key, verify `mail.lumii.com.au`, set `RESEND_API_KEY` as a Cloudflare secret.

### 7. security.txt expiry

`public/.well-known/security.txt` has `Expires: 2027-06-21`. Refresh annually.
