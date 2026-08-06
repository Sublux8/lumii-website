import { changelog as fallbackChangelog, type ChangelogEntry } from "@/data/changelog.ts";

const CHANGELOG_URL = "https://download.lumii.com.au/macos/changelog.json";
const APPCAST_URL = "https://download.lumii.com.au/macos/appcast.xml";
const MAX_FEED_BYTES = 1_000_000;
const CACHE_MS = 5 * 60 * 1000;

export interface ChangelogResult {
  readonly entries: readonly ChangelogEntry[];
  readonly source: "history" | "latest-release" | "fallback";
}

let cached: { readonly expiresAt: number; readonly result: ChangelogResult } | undefined;
let inFlight: Promise<ChangelogResult> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function validEntry(value: unknown): ChangelogEntry | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.version !== "string" || value.version.length > 40) return undefined;
  if (typeof value.dateISO !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.dateISO)) {
    return undefined;
  }
  if (typeof value.summary !== "string" || value.summary.length > 300) return undefined;
  if (
    !Array.isArray(value.items) ||
    value.items.length === 0 ||
    value.items.length > 80
  ) {
    return undefined;
  }
  if (!value.items.every((item) => typeof item === "string" && item.length <= 4_000)) {
    return undefined;
  }

  return {
    version: cleanText(value.version),
    dateISO: value.dateISO,
    summary: cleanText(value.summary),
    items: value.items.map((item) => cleanText(item as string)).filter(Boolean),
  };
}

function parseHistoryFeed(text: string): ChangelogEntry[] {
  if (text.length > MAX_FEED_BYTES) return [];

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return [];
  }

  if (
    !isRecord(payload) ||
    payload.schemaVersion !== 1 ||
    !Array.isArray(payload.releases)
  ) {
    return [];
  }

  return payload.releases
    .map(validEntry)
    .filter((entry): entry is ChangelogEntry => Boolean(entry));
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function markdownItems(markdown: string): string[] {
  const items: string[] = [];
  let current: string[] = [];

  const finish = () => {
    if (current.length === 0) return;
    const item = cleanText(
      current
        .join(" ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*|__|`|\*/g, ""),
    );
    if (item) items.push(item);
    current = [];
  };

  for (const line of markdown.split("\n")) {
    if (line.startsWith("- ")) {
      finish();
      current = [line.slice(2).trim()];
    } else if (current.length > 0 && line.trim() && !line.startsWith("## ")) {
      current.push(line.trim());
    }
  }
  finish();
  return items.slice(0, 80);
}

function summaryFor(items: readonly string[]): string {
  const text = items.join(" ").toLowerCase();
  const topics = [
    ["NDIS", ["ndis", "ndia"]],
    ["billing", ["invoice", "billing", "claim", "medicare", "dva", "tyro"]],
    ["appointments", ["appointment", "booking", "waiting list", "roster"]],
    ["telehealth", ["telehealth", "video call", "video meeting"]],
    ["patient access", ["patient portal", "family link", "online booking", "intake"]],
    ["security", ["two-factor", "security", "consent"]],
    ["reporting", ["report", "insights", "utilisation", "capacity"]],
  ] as const;

  const matches = topics
    .filter(([, words]) => words.some((word) => text.includes(word)))
    .map(([topic]) => topic)
    .slice(0, 4);

  if (matches.length === 0) return "A small maintenance release.";
  const joined =
    matches.length === 1
      ? matches[0]
      : `${matches.slice(0, -1).join(", ")} and ${matches[matches.length - 1]}`;
  return `A practical update to ${joined}.`;
}

function appcastDate(value: string): string | undefined {
  const match = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/.exec(value);
  if (!match) return undefined;
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].indexOf(match[2]);
  if (month < 0) return undefined;
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function parseAppcast(text: string): ChangelogEntry | undefined {
  if (text.length > MAX_FEED_BYTES) return undefined;
  const item = /<item\b[\s\S]*?<\/item>/.exec(text)?.[0];
  if (!item) return undefined;

  const version = /<sparkle:shortVersionString>([^<]+)<\//.exec(item)?.[1];
  const pubDate = /<pubDate>([^<]+)<\//.exec(item)?.[1];
  const markdown = /<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(
    item,
  )?.[1];
  if (!version || !pubDate || !markdown) return undefined;

  const dateISO = appcastDate(pubDate);
  const items = markdownItems(decodeXml(markdown));
  if (!dateISO || items.length === 0) return undefined;

  return {
    version: cleanText(version),
    dateISO,
    summary: summaryFor(items),
    items,
  };
}

async function fetchText(url: string, accept: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      headers: { accept },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return undefined;
    const text = await response.text();
    return text.length <= MAX_FEED_BYTES ? text : undefined;
  } catch {
    return undefined;
  }
}

function mergeEntries(groups: readonly (readonly ChangelogEntry[])[]): ChangelogEntry[] {
  const seen = new Set<string>();
  const entries: ChangelogEntry[] = [];
  for (const group of groups) {
    for (const entry of group) {
      if (seen.has(entry.version)) continue;
      seen.add(entry.version);
      entries.push(entry);
    }
  }
  return entries;
}

async function loadChangelog(): Promise<ChangelogResult> {
  const [historyText, appcastText] = await Promise.all([
    fetchText(CHANGELOG_URL, "application/json"),
    fetchText(APPCAST_URL, "application/xml, text/xml"),
  ]);

  const history = historyText ? parseHistoryFeed(historyText) : [];
  const latest = appcastText ? parseAppcast(appcastText) : undefined;
  const entries = mergeEntries([history, latest ? [latest] : [], fallbackChangelog]);

  return {
    entries,
    source: history.length > 0 ? "history" : latest ? "latest-release" : "fallback",
  };
}

export async function getChangelog(): Promise<ChangelogResult> {
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  if (!inFlight) inFlight = loadChangelog();

  try {
    const result = await inFlight;
    cached = { expiresAt: Date.now() + CACHE_MS, result };
    return result;
  } finally {
    inFlight = undefined;
  }
}
