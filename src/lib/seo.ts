/**
 * Per-locale SEO helpers: canonical URL, hreflang alternates, and the locale's
 * own <html lang>/dir. Drives the <head> in BaseLayout and the locale-aware
 * sitemap. hreflang is emitted for every ACTIVE locale plus x-default → the
 * default locale, which is what tells search engines these are regional variants
 * of one page rather than duplicate content.
 */
import { ACTIVE_LOCALES, DEFAULT_LOCALE, getLocale } from "@i18n/config.ts";
import { localizePath, stripLocale } from "@i18n/index.ts";

const SITE = "https://lumii.com.au";

export interface Alternate {
  hreflang: string;
  href: string;
}

/** Absolute canonical URL for the current locale + path. */
export function canonicalUrl(pathname: string): string {
  return new URL(pathname, SITE).href;
}

/**
 * hreflang alternates for a page. `pathname` is the localized request path —
 * bare for the default locale (`/pricing`), prefixed otherwise (`/en-us/pricing`);
 * we strip any locale segment and re-localize per active locale.
 */
export function hreflangAlternates(pathname: string): Alternate[] {
  const bare = stripLocale(pathname);
  const alternates: Alternate[] = ACTIVE_LOCALES.map((l) => ({
    hreflang: l.code,
    href: new URL(localizePath(bare, l.path), SITE).href,
  }));
  alternates.push({
    hreflang: "x-default",
    href: new URL(localizePath(bare, DEFAULT_LOCALE), SITE).href,
  });
  return alternates;
}

/** BCP-47 code + text direction for <html>, from the locale path segment. */
export function htmlLangAttrs(localePath: string): { lang: string; dir: "ltr" | "rtl" } {
  const locale = getLocale(localePath);
  return { lang: locale.code, dir: locale.dir };
}
