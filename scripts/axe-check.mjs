/**
 * Dedicated axe-core accessibility pass (§19). Lighthouse CI already runs axe
 * audits via its accessibility category, but this gives a focused, fail-fast
 * axe run over representative routes with the full ruleset.
 *
 * Boots `astro preview`, runs @axe-core/cli against the routes, then tears the
 * server down. Requires a Chrome/Chromium available to chromedriver (present on
 * CI runners; install locally with the @axe-core/cli's bundled chromedriver).
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

// Default-locale (en-AU) routes are unprefixed — see localeParam in src/i18n.
const ROUTES = [
  "http://localhost:4321/",
  "http://localhost:4321/sectors/",
  "http://localhost:4321/sectors/allied-health/",
  "http://localhost:4321/pricing/",
  "http://localhost:4321/request-access/",
];

const server = spawn("npm", ["run", "preview"], { stdio: "inherit" });
let code = 1;
try {
  // Give astro preview time to bind :4321 (readiness pattern matched in CI logs).
  await sleep(4000);
  const axe = spawn("npx", ["axe", ...ROUTES, "--exit", "--tags", "wcag2a,wcag2aa"], {
    stdio: "inherit",
  });
  code = await new Promise((res) => axe.on("exit", res));
} finally {
  server.kill("SIGTERM");
}
process.exit(code ?? 1);
