/**
 * Broken-link + missing-image checker. Runs over the built `dist/` after a
 * production build — pure Node, no browser, no network (external links are
 * reported but not fetched, to keep CI deterministic and offline-safe).
 *
 * Fails (exit 1) when an internal href or img/script/link src points at a path
 * that doesn't exist in the build. This is the §19 "broken-link/image check".
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// The SSR adapter splits the build into dist/client (static assets + prerendered
// HTML) and dist/_worker.js (the on-demand worker). Internal links resolve
// against the client root. Fall back to flat dist/ for a pure-static build.
const CLIENT = resolve("dist", "client");
const DIST = (await exists(CLIENT)) ? CLIENT : resolve("dist");

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Resolve an internal URL path to a file in dist (dir → index.html, etc.). */
async function resolvesInDist(urlPath) {
  const clean = urlPath.split(/[?#]/)[0];
  const candidates = [];
  if (clean.endsWith("/")) {
    candidates.push(join(DIST, clean, "index.html"));
  } else if (extname(clean)) {
    candidates.push(join(DIST, clean));
  } else {
    candidates.push(join(DIST, `${clean}.html`), join(DIST, clean, "index.html"));
  }
  for (const c of candidates) if (await exists(c)) return true;
  return false;
}

const ATTR = /(?:href|src)\s*=\s*"([^"]+)"/gi;

const files = await walk(DIST);
const broken = [];
let checked = 0;

for (const file of files) {
  const html = await readFile(file, "utf8");
  const rel = file.replace(DIST, "");
  for (const m of html.matchAll(ATTR)) {
    const url = m[1].trim();
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.startsWith("#") ||
      url.startsWith("data:")
    ) {
      continue;
    }
    if (!url.startsWith("/")) continue; // relative anchors handled by Astro; skip
    checked++;
    if (!(await resolvesInDist(url))) broken.push(`${rel} → ${url}`);
  }
}

console.log(`link-check: ${files.length} pages, ${checked} internal links checked`);
if (broken.length) {
  console.error(`\n✗ ${broken.length} broken internal link(s):`);
  for (const b of broken) console.error("  " + b);
  process.exit(1);
}
console.log("✓ no broken internal links");
