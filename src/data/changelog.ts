/**
 * Changelog entries (newest first). SCAFFOLD — replace the summaries/items with
 * real per-release notes as they're published. Versions mirror the macOS release
 * train; keep `version` in step with src/data/release.ts and the Sparkle appcast.
 */
export interface ChangelogEntry {
  /** Marketing version, e.g. "0.9.53". */
  readonly version: string;
  /** Release date, ISO yyyy-mm-dd (Australia/Sydney). */
  readonly dateISO: string;
  /** One-line summary. */
  readonly summary: string;
  /** Notable changes in this release. */
  readonly items: readonly string[];
}

export const changelog: readonly ChangelogEntry[] = [
  {
    version: "0.9.53",
    dateISO: "2026-06-20",
    summary: "Reliability and polish across the appointment book and billing.",
    items: [
      "A faster, more dependable appointment book.",
      "A clearer Tyro claims dashboard.",
      "General bug fixes.",
    ],
  },
  {
    version: "0.9.47",
    dateISO: "2026-05-25",
    summary: "iPad Patient Kiosk and forms-by-SMS.",
    items: [
      "Patient self-check-in kiosk with current arrival status on the appointment book.",
      "Send intake forms to patients by SMS.",
      "Smoother preparation before a consult and clearer reception follow-up.",
    ],
  },
  {
    version: "0.9.1",
    dateISO: "2026-04-20",
    summary: "Telehealth, NDIS, and accounting depth.",
    items: [
      "Branded telehealth video consults with consent capture and post-call summaries.",
      "NDIS module: budget tracking, goal progress, and bulk export.",
      "Two-way Xero accounting sync.",
    ],
  },
];
