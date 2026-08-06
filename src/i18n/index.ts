/**
 * i18n runtime — translation lookup, locale resolution from a URL, and
 * locale-aware Intl formatters. Components call `useTranslations(locale)` to get
 * a typed `t()` bound to the current locale, falling back to the default
 * catalogue for any missing key (never an empty string, never a thrown error).
 */
import enAU, { type StringKey } from "./locales/en-au.ts";
import {
  DEFAULT_LOCALE,
  LOCALE_PATHS,
  LOCALES,
  getLocale,
  type Locale,
} from "./config.ts";

/**
 * Catalogues by locale path. Reserved locales intentionally have no entry and
 * resolve through `DEFAULT_LOCALE` — that is the graceful-degradation path, not
 * a bug. Add `"en-us": enUS` here when a region's translations are authored.
 */
const catalogues: Partial<Record<string, Record<string, string>>> = {
  "en-au": enAU,
};

export type Translator = (
  key: StringKey,
  vars?: Record<string, string | number>,
) => string;

export function useTranslations(localePath: string): Translator {
  const primary = catalogues[localePath];
  const fallback = catalogues[DEFAULT_LOCALE]!;
  return (key, vars) => {
    const raw = primary?.[key] ?? fallback[key] ?? key;
    return vars ? interpolate(raw, vars) : raw;
  };
}

/** Replace {{name}} placeholders. Keeps copy out of code while allowing dynamic values. */
function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    String(vars[name] ?? `{{${name}}}`),
  );
}

/**
 * getStaticPaths source for every `[...locale]` route. Generates one page per
 * locale — ACTIVE and RESERVED alike. Reserved locales render with the default
 * catalogue (see `useTranslations` fallback), which IS the "missing translation
 * → default, not 404" behaviour: en-us / en-gb resolve and serve default copy
 * until their catalogues are authored.
 */
export function localeStaticPaths() {
  return LOCALES.map((l) => ({ params: { locale: localeParam(l.path) } }));
}

/**
 * The `[...locale]` rest-param value for a locale: `undefined` for the default,
 * which is what drops the segment so en-AU owns the site root (`/pricing`, and
 * the homepage at `/`). Routes that build their OWN getStaticPaths cross-product
 * (knowledge articles, sector pages) must spell the param through here rather
 * than passing `l.path` straight in, or the default locale keeps its prefix on
 * that route alone — a split URL scheme that only shows up in the built output.
 */
export function localeParam(localePath: string): string | undefined {
  return localePath === DEFAULT_LOCALE ? undefined : localePath;
}

/** Extract the locale path segment from a pathname, defaulting when absent. */
export function localeFromPath(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && LOCALE_PATHS.includes(seg) ? seg : DEFAULT_LOCALE;
}

/** Strip the locale prefix from a path, e.g. /en-au/pricing → /pricing. */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && LOCALE_PATHS.includes(parts[0])) parts.shift();
  return "/" + parts.join("/");
}

/**
 * Build a path for a locale. The DEFAULT locale is unprefixed — it owns the site
 * root, so localizePath("/pricing", "en-au") → /pricing and the homepage is `/`.
 * Every other locale keeps its segment: localizePath("/pricing", "en-us") →
 * /en-us/pricing.
 */
export function localizePath(path: string, localePath: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (localePath === DEFAULT_LOCALE) return clean;
  return `/${localePath}${clean === "/" ? "" : clean}`;
}

// ── Locale-aware Intl formatters (§4: never hardcode date/number/currency) ──

export function formatDate(
  date: Date,
  locale: Locale,
  opts?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale.code, opts ?? { dateStyle: "long" }).format(date);
}

export function formatNumber(
  n: number,
  locale: Locale,
  opts?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale.code, opts).format(n);
}

export function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale.code, {
    style: "currency",
    currency: locale.currency,
  }).format(amount);
}

export { getLocale, type Locale };
