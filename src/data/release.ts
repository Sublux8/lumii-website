/**
 * Current Lumii macOS release — the SINGLE place to bump per release.
 *
 * The download host (`download.lumii.com.au`) and the Sparkle appcast are the
 * source of truth for auto-updates; this file just drives the human-facing
 * /download page. Keep `version`/`build`/`url` in lockstep with the appcast item
 * published to `download.lumii.com.au/macos/appcast.xml` (see DOWNLOADS-RUNBOOK.md).
 */
export interface MacRelease {
  /** Marketing version, e.g. "0.9.53". */
  readonly version: string;
  /** Sparkle CFBundleVersion, e.g. "953". */
  readonly build: string;
  /** Direct download URL (zip served from download.lumii.com.au). */
  readonly url: string;
  /** Minimum macOS version (Sparkle minimumSystemVersion). */
  readonly minMacOS: string;
  /** Enclosure size in bytes (for display + integrity sanity). */
  readonly bytes: number;
  /** Release date, ISO yyyy-mm-dd (Australia/Sydney). */
  readonly releasedISO: string;
}

export const macRelease: MacRelease = {
  version: "0.9.54",
  build: "954",
  url: "https://download.lumii.com.au/macos/releases/Lumii-0.9.54.zip",
  minMacOS: "15.6",
  bytes: 87_040_767,
  releasedISO: "2026-06-23",
};

/** Human-readable size, e.g. "82.7 MB". */
export function formatBytes(bytes: number): string {
  const mb = bytes / 1_000_000;
  return `${mb.toFixed(1)} MB`;
}
