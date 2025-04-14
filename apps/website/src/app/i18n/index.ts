import { createInstance, type i18n } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import { getOptions } from "./settings";

const initI18next = async (lng: string, ns: string[]): Promise<i18n> => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`./locales/${language}/${namespace}.json`),
      ),
    )
    .init(getOptions(lng, ns));
  return i18nInstance;
};

export async function useTranslationServer(
  lng: string,
  namespaces: string[],
  options = { keyPrefix: "" },
): Promise<{ t: (key: string, options?: Record<string, string>) => string }> {
  const namespacesWithCommon = ["common", ...namespaces];
  const i18nextInstance = await initI18next(lng, namespacesWithCommon);
  return {
    t: i18nextInstance.getFixedT(
      lng,
      namespacesWithCommon[0],
      options.keyPrefix,
    ),
  };
}
