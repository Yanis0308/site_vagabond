import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { DepartementCard } from "@/components/departement-card";
import { JsonLd, touristDestinationSchema } from "@/lib/json-ld";
import { type AppLocale } from "@/lib/locales";
import {
  getDepartementsByRegion,
  getRegionBySlug,
  getRegions,
} from "@/lib/payload";

export const revalidate = 86400;

interface Props {
  params: Promise<{ region: string }>;
}

export async function generateStaticParams(): Promise<
  Array<{ region: string }>
> {
  const regions = await getRegions();
  return regions.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region: slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const region = await getRegionBySlug(slug, locale);
  if (region === null) return {};
  return {
    title: `Explorer ${region.nomComplet ?? region.nom}`,
    description:
      region.descriptionSeo ??
      `Découvrez les ${String(region.nbPois)} points d'intérêt de ${region.nom} avec Vagabond.`,
  };
}

export default async function RegionPage({
  params,
}: Props): Promise<ReactNode> {
  const { region: slug } = await params;
  const t = await getTranslations("explorer");
  const locale = (await getLocale()) as AppLocale;
  const region = await getRegionBySlug(slug, locale);

  if (region === null) {
    notFound();
  }

  const departements = await getDepartementsByRegion(region.id, locale);

  const schema = touristDestinationSchema({
    name: region.nom,
    description:
      region.descriptionSeo ??
      `${region.nom} — ${String(region.nbPois)} points d'intérêt à découvrir avec Vagabond.`,
    pathname: `/explorer/${slug}`,
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
              { label: region.nom },
            ]}
          />

          <h1
            className="
              font-display text-3xl font-bold text-foreground
              md:text-4xl
            "
          >
            {t("regionTitlePrefix")} {region.nomComplet ?? region.nom}{" "}
            {t("regionTitleSuffix")}
          </h1>

          <div className="mt-8 flex flex-wrap gap-6">
            <div className="rounded-xl bg-background-200 px-6 py-4 text-center">
              <span className="font-display text-3xl font-bold text-primary-500">
                {region.nbPois.toLocaleString(locale)}
              </span>
              <p className="text-sm text-typography-600">{t("pois")}</p>
            </div>
            <div className="rounded-xl bg-background-200 px-6 py-4 text-center">
              <span className="font-display text-3xl font-bold text-primary-500">
                {departements.length}
              </span>
              <p className="text-sm text-typography-600">
                {t("departementsCount")}
              </p>
            </div>
          </div>

          <h2 className="mt-12 mb-6 font-display text-2xl font-bold text-foreground">
            {t("departements")}
          </h2>
          <div
            className="
              grid grid-cols-1 gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {departements.map((dept) => (
              <DepartementCard
                key={dept.slug}
                slug={dept.slug}
                nom={dept.nom}
                numero={dept.numero}
                nbPois={dept.nbPois}
                regionSlug={slug}
                placesLabel={t("placesLabel")}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
