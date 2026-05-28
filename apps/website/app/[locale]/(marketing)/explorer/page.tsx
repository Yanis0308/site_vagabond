import { type Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { FranceMap } from "@/components/france-map";
import { RegionCard } from "@/components/region-card";
import { explorerRegionsItemListSchema, JsonLd } from "@/lib/json-ld";
import { type AppLocale } from "@/lib/locales";
import { getRegions } from "@/lib/payload";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Explorer la France",
  description:
    "Découvrez les 100 000+ points d'intérêt de France avec Vagabond. Toutes les régions, départements et villes à explorer.",
};

export default async function ExplorerPage(): Promise<ReactNode> {
  const t = await getTranslations("explorer");
  const locale = (await getLocale()) as AppLocale;
  const regions = await getRegions(locale);

  const itemListSchema = explorerRegionsItemListSchema({
    regions,
    locale,
    name: t("hubTitle"),
  });

  return (
    <>
      <JsonLd data={itemListSchema} />
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <BreadcrumbSeo
            items={[
              { label: t("breadcrumbHome"), href: "/" },
              { label: t("breadcrumbExplorer") },
            ]}
          />

          <h1
            className="
              font-display text-3xl font-bold text-foreground
              md:text-4xl
            "
          >
            {t("hubTitle")}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-typography-600">
            {t("hubDescription")}
          </p>

          <div className="mx-auto mt-12 max-w-3xl">
            <FranceMap regions={regions} placesLabel={t("placesLabel")} />
          </div>

          <div className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
              {t("regionsTitle")}
            </h2>
            <div
              className="
                grid grid-cols-1 gap-4
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {regions.map((region) => (
                <RegionCard
                  key={region.slug}
                  slug={region.slug}
                  nom={region.nom}
                  nbPois={region.nbPois}
                  placesLabel={t("placesLabel")}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
