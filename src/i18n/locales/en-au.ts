/**
 * en-AU string catalogue. EVERY user-facing string lives here — components never
 * hardcode copy (§4 guardrail). Keys are dot-namespaced by surface. A reserved
 * locale with no catalogue falls back to this one via `t()`'s default-locale
 * lookup, so partial translations degrade gracefully rather than 404.
 *
 * AU English spelling is canonical (organise, centre, licence, colour).
 */
export const strings = {
  "site.name": "Lumii",
  "site.tagline": "Practice management, illuminated.",
  "site.description":
    "Lumii is the multi-disciplinary practice management platform for Australian allied-health and general-practice clinics — booking, billing, claiming, and care plans in one calm workspace.",

  // Navigation
  "nav.sectors": "Who it's for",
  "nav.platform": "Platform",
  "nav.forClinicians": "For clinicians",
  "nav.security": "Security",
  "nav.knowledge": "Knowledge hub",
  "nav.changelog": "Changelog",
  "nav.pricing": "Pricing",
  "nav.about": "About",
  "nav.download": "Download",
  "nav.requestAccess": "Request access",
  "nav.skipToContent": "Skip to content",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.languageSwitcher": "Choose region",

  // Hero
  "hero.eyebrow": "Australian-built · pre-launch",
  "hero.title": "The practice platform that earns its keep.",
  "hero.subtitle":
    "Booking, billing, Tyro claiming, telehealth, and funded care plans — one workspace, built for the way Australian clinics actually run.",
  "hero.ctaPrimary": "Request early access",
  "hero.ctaSecondary": "See the platform",

  // Generic CTA section
  "cta.title": "Bring the calm to your clinic.",
  "cta.body":
    "Join the early-access list and we'll be in touch as we onboard foundation clinics.",
  "cta.button": "Request access",

  // Footer
  "footer.product": "Product",
  "footer.company": "Company",
  "footer.legal": "Legal",
  "footer.resources": "Resources",
  "footer.privacy": "Privacy policy",
  "footer.security": "Security",
  "footer.terms": "Terms",
  "footer.accessibility": "Accessibility",
  "footer.contact": "Contact",
  "footer.rights": "All rights reserved.",
  "footer.residency": "Patient and lead data stored in Australia.",

  // Download
  "download.title": "Download Lumii for macOS",
  "download.subtitle":
    "The native Lumii desktop app for your clinic. Installs in seconds and keeps itself up to date.",
  "download.cta": "Download for macOS",
  "download.version": "Version {{version}}",
  "download.requirements": "Requires macOS {{minMacOS}} or later · {{size}}",
  "download.released": "Released {{date}}",
  "download.autoUpdateTitle": "Updates itself",
  "download.autoUpdate":
    "Lumii checks for updates automatically and installs them securely — you'll always be on the latest release without lifting a finger.",
  "download.securityTitle": "Signed & verified",
  "download.security":
    "Every release is cryptographically signed; the app verifies each update before installing.",
  "download.residencyTitle": "Australian by design",
  "download.residency":
    "Your clinic and patient data stays in Australian-region infrastructure.",
  "download.otherPlatforms":
    "iPad, iPhone and Apple Vision builds are on the way — join the early-access list to be notified.",

  // Sectors index
  "sectors.title": "Built for your discipline",
  "sectors.subtitle":
    "Lumii adapts to how each kind of practice works — the funding bodies you claim from, the compliance you carry, the workflows your day runs on.",
  "sectors.explore": "Explore",
  "sectors.comingSoon": "Coming soon",

  // Knowledge hub
  "knowledge.title": "Knowledge hub",
  "knowledge.subtitle": "Practical guidance on running a modern Australian practice.",
  "knowledge.readMore": "Read more",
  "knowledge.empty": "Articles are on the way.",

  // Access request form
  "access.title": "Request early access",
  "access.subtitle": "Tell us about your practice and we'll reach out.",
  "access.field.name": "Your name",
  "access.field.email": "Work email",
  "access.field.clinic": "Clinic name",
  "access.field.discipline": "Primary discipline",
  "access.field.message": "Anything we should know?",
  "access.submit": "Request access",
  "access.submitting": "Sending…",
  "access.successTitle": "You're on the list.",
  "access.success":
    "Thanks — we've got your details and we'll be in touch as we onboard foundation clinics.",
  "access.error":
    "Something went wrong. Please try again, or email support@lumii.com.au.",
  "access.challenge": "Please complete the verification challenge and try again.",
  "access.privacyNote":
    "Your details are stored securely in Australia and used only to contact you about Lumii early access.",
  "access.hpLabel": "Leave this field blank",

  // Misc / a11y
  "a11y.externalLink": "(opens in a new tab)",
  "error.404.title": "Page not found",
  "error.404.body": "The page you're after doesn't exist or has moved.",
  "error.404.home": "Back to home",
} as const;

export type StringKey = keyof typeof strings;
export default strings;
