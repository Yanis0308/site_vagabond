import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { JsonLd, touristDestinationSchema } from "@/lib/json-ld";
import { type AppLocale } from "@/lib/locales";
import {
  getDepartementBySlug,
  getDepartementsByRegion,
  getRegionBySlug,
  getRegions,
} from "@/lib/payload";

export const revalidate = 86400;

interface Props {
  params: Promise<{ region: string; departement: string }>;
}

export async function generateStaticParams(): Promise<
  Array<{ region: string; departement: string }>
> {
  const regions = await getRegions();
  const results: Array<{ region: string; departement: string }> = [];
  for (const region of regions) {
    const depts = await getDepartementsByRegion(region.id);
    for (const dept of depts) {
      results.push({ region: region.slug, departement: dept.slug });
    }
  }
  return results;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { departement: slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const dept = await getDepartementBySlug(slug, locale);
  if (dept === null) return {};
  return {
    title: `Explorer ${dept.nom} (${dept.numero})`,
    description:
      dept.descriptionSeo ??
      `Découvrez les points d'intérêt du ${dept.nom} avec Vagabond.`,
  };
}

export default async function DepartementPage({
  params,
}: Props): Promise<ReactNode> {
  const { region: regionSlug, departement: deptSlug } = await params;
  const t = await getTranslations("explorer");
  const locale = (await getLocale()) as AppLocale;
  const dept = await getDepartementBySlug(deptSlug, locale);

  if (dept === null) {
    notFound();
  }

  const region = await getRegionBySlug(regionSlug, locale);

  const schema = touristDestinationSchema({
    name: dept.nom,
    description: `${dept.nom} — points d'intérêt à découvrir avec Vagabond.`,
    pathname: `/explorer/${regionSlug}/${deptSlug}`,
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
              {
                label: region?.nom ?? regionSlug,
                href: `/explorer/${regionSlug}`,
              },
              { label: dept.nom },
            ]}
          />

          <h1
            className="
              font-display text-3xl font-bold text-foreground
              md:text-4xl
            "
          >
            {t("deptTitlePrefix")} {dept.nom} {t("deptTitleSuffix")}
          </h1>

          <div className="mt-8 flex flex-wrap gap-6">
            <div className="rounded-xl bg-background-200 px-6 py-4 text-center">
              <span className="font-display text-3xl font-bold text-primary-500">
                {dept.numero}
              </span>
              <p className="text-sm text-typography-600">département</p>
            </div>
            <div className="rounded-xl bg-background-200 px-6 py-4 text-center">
              <span className="font-display text-3xl font-bold text-primary-500">
                {dept.nbPois.toLocaleString(locale)}
              </span>
              <p className="text-sm text-typography-600">{t("pois")}</p>
            </div>
          </div>

          <div className="mt-8 text-lg text-typography-600">
            <p>
              Les villes et communes du {dept.nom} seront bientôt disponibles.
              En attendant, téléchargez Vagabond pour explorer ce département.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
