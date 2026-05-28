import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { JsonLd, touristDestinationSchema } from "@/lib/json-ld";
import { type AppLocale } from "@/lib/locales";
import { getVilleBySlug } from "@/lib/payload";

export const revalidate = 604800;

interface Props {
  params: Promise<{
    region: string;
    departement: string;
    ville: string;
  }>;
}

export default async function VillePage({ params }: Props): Promise<ReactNode> {
  const { region, departement, ville } = await params;
  const t = await getTranslations("explorer");
  const locale = (await getLocale()) as AppLocale;

  const villeData = await getVilleBySlug(ville, locale);
  if (villeData === null) {
    notFound();
  }

  const schema = touristDestinationSchema({
    name: villeData.nom,
    description:
      villeData.descriptionSeo ??
      `${t("villeTitlePrefix")} ${villeData.nom} ${t("villeTitleSuffix")}`,
    pathname: `/explorer/${region}/${departement}/${ville}`,
    locale,
  });

  return (
    <>
      <JsonLd data={schema} />
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <BreadcrumbSeo
            items={[
              { label: t("breadcrumbHome"), href: "/" },
              { label: t("breadcrumbExplorer"), href: "/explorer" },
              { label: region, href: `/explorer/${region}` },
              {
                label: departement,
                href: `/explorer/${region}/${departement}`,
              },
              { label: villeData.nom },
            ]}
          />

          <h1
            className="
              font-display text-3xl font-bold text-foreground
              md:text-4xl
            "
          >
            {t("villeTitlePrefix")} {villeData.nom} {t("villeTitleSuffix")}
          </h1>

          <p className="mt-6 text-lg text-typography-600">
            {villeData.descriptionSeo ??
              `${t("villeTitlePrefix")} ${villeData.nom} ${t("villeTitleSuffix")}`}
          </p>
        </div>
      </section>
    </>
  );
}
