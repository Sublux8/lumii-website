// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

import { DEFAULT_LOCALE } from "./src/i18n/config.ts";

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

  // §4 i18n is implemented with EXPLICIT `[locale]` routing (src/pages/[locale]/…)
  // rather than Astro's built-in i18n auto-router — the built-in router does not
  // move physical file routes under a locale prefix, which collided with our
  // pages. Owning the routing gives deterministic /en-au/… URLs, region≠language
  // modelling, and reserved-locale fallback (see src/i18n/). The bare root 301s
  // to the default locale (also enforced at the edge via public/_redirects).
  redirects: {
    "/": `/${DEFAULT_LOCALE}/`,
  },

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
