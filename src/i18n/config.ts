/**
 * §4 i18n foundation — the single registry of locales for the whole site.
 *
 * Region ≠ language. A `Locale` separates the spoken `language` ("en") from the
 * `region` ("AU"). Today every active locale is English, but the model is built
 * so a future `fr-CA` (French / Canada) drops in without restructuring. The URL
 * `path` is the lowercased segment (`/en-au/…`); `code` is the BCP-47 tag used
 * verbatim for `<html lang>`, hreflang, and Intl formatters.
 *
 * `active: false` locales are RESERVED — their routes are declared so hreflang,
 * the sitemap, and the fallback table know about them, but they currently
 * rewrite to the default locale (no separate translations shipped yet). Flip to
 * `active: true` and add a string catalogue under `locales/` to launch one.
 */
export interface Locale {
  /** URL path segment, lowercase BCP-47 (e.g. "en-au"). */
  readonly path: string;
  /** BCP-47 tag for <html lang>, hreflang, Intl (e.g. "en-AU"). */
  readonly code: string;
  /** ISO 639-1 language subtag. */
  readonly language: string;
  /** ISO 3166-1 alpha-2 region subtag. */
  readonly region: string;
  /** Human label for language switchers. */
  readonly label: string;
  /** Currency for Intl.NumberFormat money rendering. */
  readonly currency: string;
  /** Text direction. RTL-ready from day one — see logical-property CSS. */
  readonly dir: "ltr" | "rtl";
  /** When false, the locale is reserved and rewrites to the default. */
  readonly active: boolean;
}

export const LOCALES: readonly Locale[] = [
  {
    path: "en-au",
    code: "en-AU",
    language: "en",
    region: "AU",
    label: "English (Australia)",
    currency: "AUD",
    dir: "ltr",
    active: true,
  },
  {
    path: "en-us",
    code: "en-US",
    language: "en",
    region: "US",
    label: "English (United States)",
    currency: "USD",
    dir: "ltr",
    active: false,
  },
  {
    path: "en-gb",
    code: "en-GB",
    language: "en",
    region: "GB",
    label: "English (United Kingdom)",
    currency: "GBP",
    dir: "ltr",
    active: false,
  },
] as const;

/** URL path segment of the default locale (Astro `defaultLocale`). */
export const DEFAULT_LOCALE = "en-au";

export const ACTIVE_LOCALES = LOCALES.filter((l) => l.active);

export const LOCALE_PATHS = LOCALES.map((l) => l.path);

export function getLocale(path: string): Locale {
  return LOCALES.find((l) => l.path === path) ?? defaultLocaleObject();
}

export function defaultLocaleObject(): Locale {
  const found = LOCALES.find((l) => l.path === DEFAULT_LOCALE);
  if (!found) throw new Error(`Default locale ${DEFAULT_LOCALE} missing from registry`);
  return found;
}
