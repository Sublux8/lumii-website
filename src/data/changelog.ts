/**
 * Customer-friendly fallback history, newest first. The live changelog is read
 * from Lumii's release feed; these entries keep the page useful if that service
 * is temporarily unavailable and preserve the earliest public releases.
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
    version: "0.9.64.10",
    dateISO: "2026-08-06",
    summary: "Stronger NDIS workflows, clearer reporting, and a smoother clinic day.",
    items: [
      "NDIS progress reports can now flow directly into billing, while mixed-management invoices can be routed to the right payer without a dead end.",
      "New safeguards highlight budget pressure, outdated item codes, expiring service bookings, and work that is getting close to the claiming deadline.",
      "Outcome measures can be linked to NDIS goals, giving plan-review reports clearer evidence of each participant's progress.",
      "Practitioner utilisation now reflects real rostered hours, supported by a new weekly capacity calculator.",
      "New operational reports help practices follow up patients who have not rebooked, understand cancellations, and see front-desk activity.",
      "Family appointment reminders now cover everyone booked that day, with one reply confirming the whole family.",
    ],
  },
  {
    version: "0.9.64.00",
    dateISO: "2026-08-05",
    summary: "Smoother bookings, consent checks, and Xero syncing.",
    items: [
      "Lumii now recognises matching invoices that already exist in Xero, avoiding repeated sync attempts or duplicate entry.",
      "Overlapping and double-booked appointments are clearly visible in week view, with helpful appointment details on hover.",
      "Appointments and patient files now gently flag when a signed consent form is missing.",
      "Intake forms and appointment reminders are spaced apart to improve reliable SMS delivery.",
      "Unnecessary Mac permission prompts no longer interrupt the start of the day.",
    ],
  },
  {
    version: "0.9.63.00",
    dateISO: "2026-08-04",
    summary: "Broader practitioner coverage and more dependable account access.",
    items: [
      "Practitioners can be linked to the governing body and code of conduct that genuinely applies to their profession.",
      "Lumii now supports 63 practitioner types, spanning regulated and self-regulated health and wellbeing professions.",
      "Clinic invitations and two-factor setup have clearer recovery paths when someone needs help signing in.",
      "Family-link requests are now visible from the main navigation, so patient requests are less likely to be missed.",
    ],
  },
  {
    version: "0.9.62.00",
    dateISO: "2026-08-03",
    summary: "Clearer claims, smarter reminders, and a more dependable patient portal.",
    items: [
      "Medicare, DVA, Tyro, and other funder outcomes now show clearer reasons and more accurate balances.",
      "Waiting-list dates and preferences are easier to manage, with openings matched to the service length patients actually need.",
      "Practices can send appointment reminders together at a chosen time of day, while existing reminder schedules continue unchanged.",
      "Patient booking, family links, and portal matching are more resilient and explain when something needs attention.",
      "Larger practices should notice faster loading across appointments, invoices, telehealth, and everyday navigation.",
    ],
  },
  {
    version: "0.9.61.00",
    dateISO: "2026-07-31",
    summary: "Safer imports, clearer claims, and flexible cancellation fees.",
    items: [
      "Imports now match existing patients more carefully instead of quietly creating duplicate records.",
      "Tyro, Medicare, DVA, and workers-compensation claim messages now show the funder's actual outcome more reliably.",
      "Practices can create reviewable cancellation and missed-appointment fee invoices, including NDIS short-notice cancellations.",
      "Lumii now checks for updates when it opens, so new versions can be installed before the clinic day begins.",
    ],
  },
  {
    version: "0.9.60.00",
    dateISO: "2026-07-30",
    summary: "The starting point for Lumii's detailed public release history.",
    items: [
      "From this release onward, customer-facing improvements are recorded as part of every Lumii release.",
    ],
  },
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
