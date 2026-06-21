// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import { DEFAULT_LOCALE } from "./src/i18n/config.ts";

import cloudflare from "@astrojs/cloudflare";

// Canonical apex chosen as `lumii.com.au` (www → apex 301 at the edge; see _headers).
const SITE = "https://lumii.com.au";

// https://astro.build/config
export default defineConfig({
  site: SITE,

  // PHASE 0 is 100% static (SSG) — no on-demand routes yet — so it builds and
  // deploys to Cloudflare (Workers static assets or Pages) WITHOUT the SSR
  // adapter. The adapter is added in Phase 2 when the signup endpoint and
  // dynamic OG images need on-demand rendering; see README "Hosting" for the
  // exact change (import @astrojs/cloudflare + adapter + output:"server").
  output: "static",

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

  adapter: cloudflare(),
});