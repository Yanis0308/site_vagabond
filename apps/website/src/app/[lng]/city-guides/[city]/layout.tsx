import { type Metadata } from "next";

import { useTranslationServer } from "@/app/i18n";
import { getMetadata } from "@/app/metadata";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lng: string; city: string }>;
}): Promise<Metadata> => {
  const { lng, city } = await params;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- for server side
  const { t } = await useTranslationServer(lng, ["cities-top-10"]);

  const mergedMetadata = await getMetadata({
    lng,
    title: t("metadata.title", {
      ns: "cities-top-10",
      city: t(`${city}.name`, { ns: "cities-top-10" }),
    }),
  });
  return mergedMetadata;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
