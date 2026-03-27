import { publicEnv } from "./config/public";
import { type AppLocale, DEFAULT_LOCALE } from "./locales";

/** Base site URL without trailing slash (for concatenation). */
export const SITE_URL_NORMALIZED = publicEnv.SITE_URL.replace(/\/$/, "");

/**
 * Pathname with next-intl `localePrefix: "as-needed"` rules (default locale has no prefix).
 */
export function localizedPathname(pathname: string, locale: AppLocale): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === DEFAULT_LOCALE) {
    return path;
  }
  return `/${locale}${path}`;
}

export function siteAbsoluteUrl(pathname: string, locale: AppLocale): string {
  return `${SITE_URL_NORMALIZED}${localizedPathname(pathname, locale)}`;
}
