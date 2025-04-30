import { type Metadata } from "next";

import { useTranslationServer } from "./i18n";
import { languages } from "./i18n/settings";

export const getMetadata = async ({
  lng,
}: {
  lng: string;
}): Promise<Metadata> => {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- for server side
  const { t } = await useTranslationServer(lng, []);

  return {
    title: t("metadata.title"),
    openGraph: {
      title: t("metadata.openGraph.title"),
      description: t("metadata.openGraph.description"),
      locale: lng,
      alternateLocale: languages.filter((l) => l !== lng),
    },
  };
};
