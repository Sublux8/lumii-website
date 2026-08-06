import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverEntry = resolve(root, "dist/server/entry.mjs");
const sitesEntry = resolve(root, "dist/server/index.js");
const hostingConfig = resolve(root, ".openai/hosting.json");
const packagedHostingConfig = resolve(root, "dist/.openai/hosting.json");
const clientDir = resolve(root, "dist/client");

await assertRootPageExists();
await assertCspCoverage();

// Sites loads the built worker from this conventional entrypoint.
await mkdir(dirname(packagedHostingConfig), { recursive: true });
await copyFile(serverEntry, sitesEntry);
await copyFile(hostingConfig, packagedHostingConfig);

/**
 * The site root must be a REAL prerendered page, not a redirect. The Sites host
 * ignores `_redirects` entirely, so when `/` was an Astro `redirects` entry the
 * apex returned a hard 404 in production while every local check passed — the
 * rule was sitting in dist/client/_redirects doing nothing. Fail the build here
 * rather than ship a homepage that only exists on paper.
 */
async function assertRootPageExists() {
  const names = (await readdir(clientDir, { withFileTypes: true })).map((e) => e.name);
  if (!names.includes("index.html")) {
    throw new Error(
      "dist/client/index.html is missing — the site root would 404 in production. " +
        "The default locale must render at `/` (see localeParam in src/i18n/index.ts).",
    );
  }
}

/**
 * Guard the `_headers` CSP posture against the two failure modes that have
 * actually bitten this project (both documented at the top of public/_headers):
 *
 *  1. A page matching TWO CSP rules. Static-assets `_headers` appends rather than
 *     overrides, so the browser enforces the intersection of both policies — that
 *     is what silently re-blocked the Sveltia CMS at /admin.
 *  2. A page matching ZERO CSP rules. Because the default locale is unprefixed,
 *     marketing routes are enumerated one-per-line; a new page added under
 *     src/pages/[...locale]/ ships with no CSP at all unless the author also adds
 *     its line there. Nothing in the rendered page reveals the omission.
 *
 * Both are invisible in review and in the built output, so they are checked here
 * against the real route list rather than left to discipline.
 */
async function assertCspCoverage() {
  const rules = parseCspRules(await readFile(resolve(clientDir, "_headers"), "utf8"));
  const routes = await htmlRoutes(clientDir);
  const problems = [];

  for (const route of routes) {
    const matched = rules.filter((rule) => matchesRule(rule.path, route));
    if (matched.length !== 1) {
      problems.push(
        matched.length === 0
          ? `${route} matches NO CSP rule — add it to public/_headers`
          : `${route} matches ${matched.length} CSP rules (${matched
              .map((m) => m.path)
              .join(", ")}) — browsers enforce the intersection`,
      );
    }
  }

  // Every non-CMS rule is the marketing policy and must be byte-identical; a
  // one-line edit that misses its siblings is the drift this catches.
  const marketing = rules.filter((rule) => !rule.path.startsWith("/admin"));
  const variants = new Set(marketing.map((rule) => rule.value));
  if (variants.size > 1) {
    problems.push(
      `marketing CSP has drifted into ${variants.size} variants across ${marketing.length} rules — they must be identical`,
    );
  }

  if (problems.length > 0) {
    throw new Error(`_headers CSP validation failed:\n  - ${problems.join("\n  - ")}`);
  }
}

/** Rules from a `_headers` file that set a CSP, as `{ path, value }`. */
function parseCspRules(text) {
  const rules = [];
  let path = null;
  for (const raw of text.split("\n")) {
    if (raw.trim() === "" || raw.trimStart().startsWith("#")) continue;
    if (!raw.startsWith(" ") && !raw.startsWith("\t")) {
      path = raw.trim();
      continue;
    }
    const [name, ...rest] = raw.trim().split(":");
    if (path && name.toLowerCase() === "content-security-policy") {
      rules.push({ path, value: rest.join(":").trim() });
    }
  }
  return rules;
}

/** Cloudflare `_headers` path matching: exact, or `/prefix/*` covering `/prefix/…`. */
function matchesRule(rulePath, route) {
  if (rulePath === "/*") return true;
  if (rulePath.endsWith("/*")) return route.startsWith(rulePath.slice(0, -1));
  return route === rulePath || route === `${rulePath}/`;
}

/**
 * Request paths for every built HTML page, e.g. `/pricing/`. 404.html and
 * 500.html are excluded by construction (they are not `index.html`): each is
 * served in response to some OTHER path, so the `_headers` rule that applies is
 * whichever one matches the original request, not the error page's own location.
 */
async function htmlRoutes(dir, prefix = "/") {
  const routes = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      routes.push(
        ...(await htmlRoutes(resolve(dir, entry.name), `${prefix}${entry.name}/`)),
      );
    } else if (entry.name === "index.html") {
      routes.push(prefix);
    }
  }
  return routes;
}
