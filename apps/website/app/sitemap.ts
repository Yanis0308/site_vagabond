import { type MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import {
  getDepartementsByRegion,
  getPublishedArticles,
  getRegions,
} from "@/lib/payload";

const BASE_URL = "https://www.vagabond.gg";

function localeUrl(path: string, locale: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${BASE_URL}${prefix}${path}`;
}

function buildAlternates(path: string): Record<string, string> {
  const result: Record<string, string> = { "x-default": `${BASE_URL}${path}` };
  for (const locale of routing.locales) {
    result[locale] = localeUrl(path, locale);
  }
  return result;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BASE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      priority: 1.0,
      changeFrequency: "weekly",
      alternates: { languages: buildAlternates("") },
    },
    {
      url: `${baseUrl}/pro`,
      priority: 0.9,
      changeFrequency: "monthly",
      alternates: { languages: buildAlternates("/pro") },
    },
    {
      url: `${baseUrl}/explorer`,
      priority: 0.9,
      changeFrequency: "weekly",
      alternates: { languages: buildAlternates("/explorer") },
    },
    {
      url: `${baseUrl}/blog`,
      priority: 0.8,
      changeFrequency: "daily",
      alternates: { languages: buildAlternates("/blog") },
    },
    {
      url: `${baseUrl}/contact`,
      priority: 0.5,
      changeFrequency: "monthly",
      alternates: { languages: buildAlternates("/contact") },
    },
    {
      url: `${baseUrl}/mentions-legales`,
      priority: 0.3,
      changeFrequency: "yearly",
      alternates: { languages: buildAlternates("/mentions-legales") },
    },
    {
      url: `${baseUrl}/confidentialite`,
      priority: 0.3,
      changeFrequency: "yearly",
      alternates: { languages: buildAlternates("/confidentialite") },
    },
    {
      url: `${baseUrl}/cgu`,
      priority: 0.3,
      changeFrequency: "yearly",
      alternates: { languages: buildAlternates("/cgu") },
    },
  ];

  let regionPages: MetadataRoute.Sitemap = [];
  let departementPages: MetadataRoute.Sitemap = [];
  let articlePages: MetadataRoute.Sitemap = [];

  try {
    const regions = await getRegions();
    regionPages = regions.map((r) => ({
      url: `${baseUrl}/explorer/${r.slug}`,
      priority: 0.8,
      changeFrequency: "weekly" as const,
      lastModified: new Date(),
      alternates: { languages: buildAlternates(`/explorer/${r.slug}`) },
    }));

    const deptResults = await Promise.all(
      regions.map(async (r) => {
        const depts = await getDepartementsByRegion(r.id);
        return depts.map((d) => ({
          url: `${baseUrl}/explorer/${r.slug}/${d.slug}`,
          priority: 0.7,
          changeFrequency: "weekly" as const,
          lastModified: new Date(),
          alternates: {
            languages: buildAlternates(`/explorer/${r.slug}/${d.slug}`),
          },
        }));
      }),
    );
    departementPages = deptResults.flat();

    const { docs: articles } = await getPublishedArticles({ limit: 200 });
    articlePages = articles
      .filter((a) => a.publishedAt !== null)
      .map((a) => ({
        url: `${baseUrl}/blog/${a.slug}`,
        priority: 0.7,
        changeFrequency: "monthly" as const,
        lastModified:
          a.publishedAt !== null ? new Date(a.publishedAt) : new Date(),
      }));
  } catch (error: unknown) {
    // eslint-disable-next-line no-console -- log sitemap generation failures for debugging
    console.error("[sitemap] Failed to fetch dynamic pages:", error);
  }

  return [...staticPages, ...regionPages, ...departementPages, ...articlePages];
}
