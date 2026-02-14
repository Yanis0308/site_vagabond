import * as Localization from "expo-localization";
import { default as i18n } from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import frCommon from "./locales/fr/common.json";

const resources = {
  en: {
    common: enCommon,
  },
  fr: {
    common: frCommon,
  },
};
type SupportedLocale = keyof typeof resources;

const locales = Localization.getLocales()
  .map((locale) => locale.languageCode)
  .filter((locale) => locale !== null);

const supportedLocales = Object.keys(resources);
const defaultLocale: SupportedLocale = "en";

void i18n.use(initReactI18next).init({
  resources,
  lng:
    locales.find((languageCode) => supportedLocales.includes(languageCode)) ??
    defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: {
    escapeValue: false, // already done by React
  },
});

export const changeLanguage = async (lang: string): Promise<void> => {
  return void (await i18n.changeLanguage(lang));
};

export const getCurrentLanguage = (): string => {
  return i18n.language;
};

export default i18n;
