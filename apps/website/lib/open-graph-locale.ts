import { type AppLocale, LOCALES } from "./locales";

/** Open Graph `locale` / `alternateLocale` tags (underscore form). */
const APP_LOCALE_TO_OPEN_GRAPH: Record<AppLocale, string> = {
  fr: "fr_FR",
  en: "en_US",
  de: "de_DE",
  nl: "nl_NL",
  it: "it_IT",
  es: "es_ES",
  pt: "pt_PT",
  zh: "zh_CN",
  ja: "ja_JP",
  pl: "pl_PL",
  ko: "ko_KR",
};

export function openGraphLocaleTag(locale: AppLocale): string {
  return APP_LOCALE_TO_OPEN_GRAPH[locale];
}

export function openGraphAlternateLocales(locale: AppLocale): string[] {
  return LOCALES.filter((l) => l !== locale).map(
    (l) => APP_LOCALE_TO_OPEN_GRAPH[l],
  );
}
