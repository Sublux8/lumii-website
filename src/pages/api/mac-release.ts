import type { APIRoute } from "astro";

/**
 * Live macOS release metadata — the second (read-only) on-demand route.
 *
 * Reads the Sparkle appcast (the source of truth published to
 * download.lumii.com.au on every release) and returns the NEWEST release as
 * JSON. The /download page hydrates from this, so the version + download link
 * update the instant a new build is uploaded — no website rebuild, no editing
 * src/data/release.ts (which stays the server-rendered no-JS fallback).
 *
 * Same-origin GET (no CORS): the browser calls /api/mac-release and this Worker
 * fetches the appcast server-side. The appcast is served `no-cache`, so a fresh
 * fetch always sees the latest; we put a short edge cache on OUR JSON so a burst
 * of visitors doesn't re-parse on every hit.
 */
export const prerender = false;

const APPCAST_URL = "https://download.lumii.com.au/macos/appcast.xml";

const MONTHS: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function json(body: unknown, status = 200, cache = "public, max-age=60"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    },
  });
}

/** First capture of `re` within `xml`, trimmed; "" when absent. */
function pick(re: RegExp, xml: string): string {
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

/**
 * RFC-822 pubDate ("Fri, 26 Jun 2026 09:12:45 +1000") → ISO yyyy-mm-dd, taken
 * verbatim from the string's calendar fields. We deliberately do NOT go through
 * `new Date().toISOString()`: that converts to UTC and would roll a late-evening
 * AET release back to the previous day.
 */
function pubDateToISO(s: string): string {
  const m = /(\d{1,2})\s+(\w{3})\s+(\d{4})/.exec(s);
  if (!m) return "";
  const month = MONTHS[m[2]];
  if (!month) return "";
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

export const GET: APIRoute = async () => {
  let xml: string;
  try {
    const res = await fetch(APPCAST_URL);
    if (!res.ok) throw new Error(`appcast ${res.status}`);
    xml = await res.text();
  } catch (err) {
    console.error("[mac-release] appcast fetch failed:", err);
    return json({ ok: false, error: "appcast" }, 502, "no-store");
  }

  // Scope every field to the FIRST <item> (Sparkle lists newest first) so a
  // malformed later entry can't bleed into the parsed result.
  const item = /<item\b[\s\S]*?<\/item>/.exec(xml)?.[0] ?? xml;

  const version = pick(/<sparkle:shortVersionString>([^<]+)</, item);
  const enclosureUrl = pick(/<enclosure[^>]*\burl="([^"]+)"/, item);
  if (!version || !enclosureUrl) {
    return json({ ok: false, error: "parse" }, 502, "no-store");
  }

  // The enclosure is the Sparkle .zip (auto-update). Humans get the .dmg sibling
  // — same path, .zip→.dmg — which carries the drag-to-Applications installer.
  return json({
    ok: true,
    version,
    build: pick(/<sparkle:version>([^<]+)</, item),
    minMacOS: pick(/<sparkle:minimumSystemVersion>([^<]+)</, item),
    bytes: Number(pick(/<enclosure[^>]*\blength="([^"]+)"/, item)) || 0,
    releasedISO: pubDateToISO(pick(/<pubDate>([^<]+)</, item)),
    zipUrl: enclosureUrl,
    dmgUrl: enclosureUrl.replace(/\.zip$/, ".dmg"),
  });
};

/** Any non-GET method is a 405. */
export const ALL: APIRoute = () => json({ ok: false, error: "method" }, 405, "no-store");
