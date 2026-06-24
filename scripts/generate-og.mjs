/**
 * Generates the default Open Graph share card → public/og.png (1200×630, the
 * standard summary_large_image size). Run with `npm run og` whenever the brand
 * mark, tagline, or palette changes; the rendered PNG is committed and shipped
 * as the static asset (CI never regenerates it, so local fonts decide the look).
 *
 * Rasterised from an SVG via @resvg/resvg-js — an OG image MUST be raster
 * (Slack / iMessage / X / LinkedIn don't render SVG og:image). The wordmark
 * reuses the brand's rounded font stack + gradient from public/logo.svg, and the
 * background reproduces the "Platinum" aurora (warmth → gold → teal → blue washes
 * over a mint base) from src/styles/tokens.css.
 */
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../public/og.png", import.meta.url));

// Brand palette (src/styles/tokens.css).
const INK = "#17212D";
const MINT = "#effbf7";
const WARMTH = "#f4b6a6";
const GOLD = "#f2c766";
const TEAL = "#10b9a7";
const BLUE = "#5f7ce6";

const ROUNDED =
  "'SF Pro Rounded', 'Arial Rounded MT Bold', 'Nunito Sans', system-ui, sans-serif";
const SANS = "system-ui, -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const EYEBROW = "AUSTRALIAN-BUILT · PRE-LAUNCH";
const TAGLINE = "Practice management with a warm clinical glow.";
const DOMAIN = "lumii.com.au";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Wordmark gradient: ink for "lum", warming into teal/blue across "ii". -->
    <linearGradient id="word" x1="0" y1="0" x2="1" y2="0.25">
      <stop offset="0%" stop-color="${INK}"/>
      <stop offset="52%" stop-color="${INK}"/>
      <stop offset="68%" stop-color="${WARMTH}"/>
      <stop offset="84%" stop-color="${TEAL}"/>
      <stop offset="100%" stop-color="${BLUE}"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${WARMTH}" stop-opacity="0"/>
      <stop offset="30%" stop-color="${WARMTH}" stop-opacity="0.7"/>
      <stop offset="68%" stop-color="${TEAL}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${BLUE}" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="warmth" cx="20%" cy="16%" r="60%">
      <stop offset="0%" stop-color="${WARMTH}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="${WARMTH}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gold" cx="82%" cy="20%" r="55%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="teal" cx="50%" cy="62%" r="60%">
      <stop offset="0%" stop-color="${TEAL}" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="${TEAL}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blue" cx="86%" cy="92%" r="55%">
      <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="topwash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-40%" width="140%" height="190%">
      <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="${WARMTH}" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Aurora background -->
  <rect width="1200" height="630" fill="${MINT}"/>
  <rect width="1200" height="630" fill="url(#warmth)"/>
  <rect width="1200" height="630" fill="url(#gold)"/>
  <rect width="1200" height="630" fill="url(#teal)"/>
  <rect width="1200" height="630" fill="url(#blue)"/>
  <rect width="1200" height="630" fill="url(#topwash)"/>

  <!-- Refined hairline frame -->
  <rect x="28" y="28" width="1144" height="574" rx="30" fill="none"
        stroke="${TEAL}" stroke-opacity="0.16" stroke-width="1.5"/>

  <!-- Eyebrow -->
  <text x="600" y="214" text-anchor="middle" font-family="${SANS}"
        font-size="27" font-weight="600" letter-spacing="5"
        fill="${TEAL}" fill-opacity="0.92">${EYEBROW}</text>

  <!-- Wordmark -->
  <g filter="url(#soft)">
    <text x="600" y="380" text-anchor="middle" font-family="${ROUNDED}"
          font-size="184" font-weight="700" fill="url(#word)">lumii</text>
  </g>
  <rect x="510" y="408" width="180" height="9" rx="4.5" fill="url(#rule)"/>

  <!-- Tagline -->
  <text x="600" y="496" text-anchor="middle" font-family="${SANS}"
        font-size="40" font-weight="500" fill="${INK}" fill-opacity="0.82">${TAGLINE}</text>

  <!-- Domain -->
  <text x="600" y="566" text-anchor="middle" font-family="${SANS}"
        font-size="26" font-weight="600" letter-spacing="1.5"
        fill="${INK}" fill-opacity="0.45">${DOMAIN}</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: { loadSystemFonts: true },
  background: MINT,
});
writeFileSync(OUT, resvg.render().asPng());
console.log(`Wrote ${OUT}`);
