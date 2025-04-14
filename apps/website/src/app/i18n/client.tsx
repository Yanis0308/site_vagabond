"use client";

import { getCookie, setCookie } from "cookies-next";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { useEffect, useState } from "react";
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from "react-i18next";

import { cookieName, getOptions, languages } from "./settings";

const runsOnServerSide = typeof window === "undefined";

//
void i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    ...getOptions(),
    lng: undefined, // let detect the language on client side
    detection: {
      order: ["path", "htmlTag", "cookie", "navigator"],
    },
    preload: runsOnServerSide ? languages : [],
  });

export function useTranslationClient(
  lng: string,
  namespaces: string[],
): { t: (key: string, options?: Record<string, string>) => string } {
  const namespacesWithCommon = ["common", ...namespaces];
  const i18nextCookie = getCookie(cookieName);
  const ret = useTranslationOrg(namespacesWithCommon);
  const { i18n } = ret;
  if (runsOnServerSide && i18n.resolvedLanguage !== lng) {
    void i18n.changeLanguage(lng);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- as provided by i18next
    const [activeLng, setActiveLng] = useState(i18n.resolvedLanguage);
    // eslint-disable-next-line react-hooks/rules-of-hooks -- as provided by i18next
    useEffect(() => {
      if (activeLng === i18n.resolvedLanguage) return;
      setActiveLng(i18n.resolvedLanguage);
    }, [activeLng, i18n.resolvedLanguage]);
    // eslint-disable-next-line react-hooks/rules-of-hooks -- as provided by i18next
    useEffect(() => {
      if (i18n.resolvedLanguage === lng) return;
      void i18n.changeLanguage(lng);
    }, [lng, i18n]);
    // eslint-disable-next-line react-hooks/rules-of-hooks -- as provided by i18next
    useEffect(() => {
      if (i18nextCookie === lng) return;
      void setCookie(cookieName, lng, { path: "/" });
    }, [lng, i18nextCookie]);
  }
  return ret;
}
