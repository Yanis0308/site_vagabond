import { type Metadata } from "next";

import { useTranslationServer } from "./i18n";
import { languages } from "./i18n/settings";

export const getMetadata = async ({
  lng,
  title,
}: {
  lng: string;
  title?: string;
}): Promise<Metadata> => {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- for server side
  const { t } = await useTranslationServer(lng, []);

  return {
    title: title ?? t("metadata.title"),
    openGraph: {
      title: title ?? t("metadata.openGraph.title"),
      description: t("metadata.openGraph.description"),
      locale: lng,
      alternateLocale: languages.filter((l) => l !== lng),
      images: ["/img/opengraph-image.png"],
    },
  };
};
