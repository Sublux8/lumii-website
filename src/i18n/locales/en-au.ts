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
  "site.tagline": "Care, beautifully connected.",
  "site.description":
    "Lumii brings Australian practice management and personal health together — helping care teams work with less friction and people stay connected between visits.",

  // Navigation
  "nav.sectors": "Who it's for",
  "nav.platform": "For practices",
  "nav.myLumii": "myLumii",
  "nav.forClinicians": "For clinicians",
  "nav.security": "Security",
  "nav.knowledge": "Knowledge hub",
  "nav.changelog": "Changelog",
  "nav.pricing": "Pricing",
  "nav.about": "About",
  "nav.download": "Download",
  "nav.requestAccess": "Register interest",
  "nav.skipToContent": "Skip to content",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.languageSwitcher": "Choose region",

  // Hero
  "hero.eyebrow": "Made for Australian care",
  "hero.title": "A calmer way to run care.",
  "hero.subtitle":
    "Booking, billing, claiming, telehealth and funded care plans — kept together so your team can focus on people.",
  "hero.ctaPrimary": "Tell us what you need",
  "hero.ctaSecondary": "See Lumii in action",

  // Generic CTA section
  "cta.title": "See what Lumii could change for you.",
  "cta.body":
    "Whether you run a practice, work in care or want a clearer view of your own health, tell us what would make the greatest difference.",
  "cta.button": "Register interest",

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
  "footer.residency": "Clinic, patient and enquiry data stored in Australia.",

  // Download
  "download.title": "Download Lumii for macOS",
  "download.subtitle":
    "Lumii for your clinic’s Mac. It is quick to install and keeps itself up to date.",
  "download.cta": "Download for macOS",
  "download.version": "Version {{version}}",
  "download.requirements": "Requires macOS {{minMacOS}} or later · {{size}}",
  "download.released": "Released {{date}}",
  "download.autoUpdateTitle": "Updates itself",
  "download.autoUpdate":
    "Lumii checks for updates automatically and installs them securely — you'll always be on the latest release without lifting a finger.",
  "download.securityTitle": "Checked before every update",
  "download.security":
    "Every update is checked before it installs, helping protect your clinic from tampered software.",
  "download.residencyTitle": "Australian by design",
  "download.residency":
    "Your clinic and patient data stays in Australia.",
  "download.otherPlatforms":
    "Interested in myLumii for iPhone or Android? Register your interest and we’ll keep you close as the personal experience opens.",

  // Sectors index
  "sectors.title": "Built for the way you care",
  "sectors.subtitle":
    "From solo practitioners and specialist rooms to multidisciplinary clinics and people managing their own health, Lumii meets each experience where it is.",
  "sectors.explore": "Explore",
  "sectors.comingSoon": "Coming soon",

  // Knowledge hub
  "knowledge.title": "Knowledge hub",
  "knowledge.subtitle": "Practical guidance on running a modern Australian practice.",
  "knowledge.readMore": "Read more",
  "knowledge.empty": "Articles are on the way.",

  // Access request form
  "access.title": "Tell us what you need from Lumii",
  "access.subtitle":
    "Whether you are looking for a better way to run a practice or a clearer home for your own care, tell us what matters. A real person from Lumii will be in touch.",
  "access.field.name": "Your name",
  "access.field.email": "Email address",
  "access.field.clinic": "Practice or clinic name (if applicable)",
  "access.field.discipline": "Your role, specialty or area of interest (optional)",
  "access.field.message": "What would you like Lumii to help with? (optional)",
  "access.interest.legend": "I'm interested in Lumii…",
  "access.interest.practice": "For a clinic or practice",
  "access.interest.practitioner": "As a practitioner",
  "access.interest.personal": "For myself or my family",
  "access.submit": "Register my interest",
  "access.submitting": "Sending…",
  "access.successTitle": "Thanks — we’d love to keep talking.",
  "access.success":
    "We’ve received your details. A real person from Lumii will be in touch about the experience you’re interested in.",
  "access.error":
    "Something went wrong. Please try again, or email support@lumii.com.au.",
  "access.challenge": "Please complete the verification challenge and try again.",
  "access.privacyNote":
    "Your details are stored securely in Australia and used only to respond to your Lumii enquiry.",
  "access.hpLabel": "Leave this field blank",

  // Misc / a11y
  "a11y.externalLink": "(opens in a new tab)",
  "error.404.title": "Page not found",
  "error.404.body": "The page you're after doesn't exist or has moved.",
  "error.404.home": "Back to home",
} as const;

export type StringKey = keyof typeof strings;
export default strings;
