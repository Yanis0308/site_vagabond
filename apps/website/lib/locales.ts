export const LOCALES = [
  "fr",
  "en",
  "de",
  "nl",
  "it",
  "es",
  "pt",
  "zh",
  "ja",
  "pl",
  "ko",
] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";
