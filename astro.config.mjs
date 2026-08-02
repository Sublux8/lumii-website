// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// Canonical apex chosen as `lumii.com.au` (www → apex 301 at the edge; see _headers).
const SITE = "https://lumii.com.au";

// https://astro.build/config
export default defineConfig({
  site: SITE,

  // The site stays SSG-first: every marketing/knowledge page is prerendered to a
  // static asset (cacheable, governed by public/_headers). The §12 access-request
  // endpoint is the ONLY on-demand route — it opts out per-file with
  // `export const prerender = false`, so Astro's hybrid model renders it through
  // the Cloudflare Worker while everything else remains static. Keeping the
  // dynamic surface to a single JSON endpoint means the static CSP/header posture
  // is untouched for all HTML pages.
  output: "static",

  // Cloudflare Workers adapter (static assets + the one on-demand route). The
  // generated worker lands at dist/_worker.js/index.js — wrangler.jsonc points
  // `main` there and binds ./dist as ASSETS. Adapter v13 runs the worker in
  // workerd via @cloudflare/vite-plugin for BOTH `astro dev` and build, reading
  // wrangler `vars` + .dev.vars, so `import { env } from "cloudflare:workers"`
  // resolves identically in dev and production (Astro v6 removed
  // `Astro.locals.runtime.env`).
  adapter: cloudflare(),

  // §4 i18n is implemented with EXPLICIT `[...locale]` routing
  // (src/pages/[...locale]/…) rather than Astro's built-in i18n auto-router — the
  // built-in router does not move physical file routes under a locale prefix,
  // which collided with our pages. Owning the routing gives deterministic URLs,
  // region≠language modelling, and reserved-locale fallback (see src/i18n/).
  //
  // The DEFAULT locale is UNPREFIXED: `localeParam()` returns `undefined` for
  // en-au, so the rest param collapses and en-AU owns the root (`/`, `/pricing`).
  // Reserved locales keep their segment (`/en-us/pricing`). There is deliberately
  // NO `redirects: { "/": … }` here: under the Cloudflare adapter Astro does not
  // emit an HTML page for a configured redirect, it writes a `_redirects` rule —
  // and the Sites host serving this project ignores `_redirects` entirely, so the
  // root 404'd in production. A real prerendered dist/client/index.html is the
  // only root that survives a host with no redirect support.

  integrations: [mdx(), sitemap()],

  // No third-party scripts, no inline styles. Keeping stylesheets external means
  // the production CSP can be `style-src 'self'` with zero hashes/nonces — the
  // strongest, most static-friendly posture (see ARCHITECTURE.md §Security).
  // Tailwind v4 runs via its PostCSS plugin (postcss.config.mjs), not the Vite
  // plugin — Astro 6's rolldown bundler is currently incompatible with
  // @tailwindcss/vite's resolve hook. See README "Known stack notes".
  build: {
    inlineStylesheets: "never",
  },
});
