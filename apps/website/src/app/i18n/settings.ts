import { type InitOptions } from "i18next";

export const fallbackLng = "fr";
export const languages = [fallbackLng, "en"];
export const defaultNS = "common";
export const cookieName = "i18next";

export function getOptions(lng = fallbackLng, ns = [defaultNS]): InitOptions {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
