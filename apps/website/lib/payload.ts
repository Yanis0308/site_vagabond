import configPromise from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

import { type AppLocale, DEFAULT_LOCALE } from "./locales";
import { mediaToAbsoluteUrl } from "./media-absolute-url";

export async function getPayloadClient(): ReturnType<typeof getPayload> {
  return await getPayload({ config: configPromise });
}

// --- Regions ---

export async function getRegions(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<Array<{ slug: string; nom: string; nbPois: number; id: string }>> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "regions",
    sort: "nom",
    limit: 100,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  return result.docs.map((doc) => ({
    id: String(doc.id),
    slug: doc.slug,
    nom: doc.nom,
    nbPois: doc.nbPois ?? 0,
  }));
}

export async function getRegionBySlug(
  slug: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<{
  id: string;
  slug: string;
  nom: string;
  nomComplet: string | null;
  descriptionSeo: string | null;
  nbPois: number;
} | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "regions",
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  const doc = result.docs[0];
  if (doc === undefined) return null;
  return {
    id: String(doc.id),
    slug: doc.slug,
    nom: doc.nom,
    nomComplet: doc.nomComplet ?? null,
    descriptionSeo: doc.descriptionSeo ?? null,
    nbPois: doc.nbPois ?? 0,
  };
}

// --- Departements ---

export async function getDepartementsByRegion(
  regionId: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<
  Array<{ slug: string; nom: string; numero: string; nbPois: number }>
> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "departements",
    where: { region: { equals: regionId } },
    sort: "nom",
    limit: 100,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  return result.docs.map((doc) => ({
    slug: doc.slug,
    nom: doc.nom,
    numero: doc.numero,
    nbPois: doc.nbPois ?? 0,
  }));
}

export async function getDepartementBySlug(
  slug: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<{
  id: string;
  slug: string;
  nom: string;
  numero: string;
  descriptionSeo: string | null;
  nbPois: number;
  region: string;
} | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "departements",
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  const doc = result.docs[0];
  if (doc === undefined) return null;
  return {
    id: String(doc.id),
    slug: doc.slug,
    nom: doc.nom,
    numero: doc.numero,
    descriptionSeo: doc.descriptionSeo ?? null,
    nbPois: doc.nbPois ?? 0,
    region:
      typeof doc.region === "object"
        ? String(doc.region.id)
        : String(doc.region),
  };
}

// --- Villes ---

export async function getVilleBySlug(
  slug: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<{
  slug: string;
  nom: string;
  descriptionSeo: string | null;
  nbPois: number;
} | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "villes",
    where: { slug: { equals: slug } },
    limit: 1,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  const doc = result.docs[0];
  if (doc === undefined) return null;
  return {
    slug: doc.slug,
    nom: doc.nom,
    descriptionSeo: doc.descriptionSeo ?? null,
    nbPois: doc.nbPois ?? 0,
  };
}

// --- Articles ---

export async function getPublishedArticles(options?: {
  category?: string;
  page?: number;
  limit?: number;
  locale?: AppLocale;
}): Promise<{
  docs: Array<{
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: string | null;
    author: string | null;
  }>;
  totalPages: number;
  page: number;
}> {
  const payload = await getPayloadClient();
  const locale = options?.locale ?? DEFAULT_LOCALE;

  let categoryId: string | undefined;
  if (options?.category !== undefined) {
    const catResult = await payload.find({
      collection: "categories",
      where: { slug: { equals: options.category } },
      limit: 1,
      locale,
      fallbackLocale: DEFAULT_LOCALE,
    });
    const cat = catResult.docs[0];
    if (cat !== undefined) {
      categoryId = String(cat.id);
    } else {
      return { docs: [], totalPages: 0, page: 1 };
    }
  }

  const result = await payload.find({
    collection: "articles",
    where: {
      status: { equals: "published" },
      ...(categoryId !== undefined ? { category: { equals: categoryId } } : {}),
    },
    sort: "-publishedAt",
    page: options?.page ?? 1,
    limit: options?.limit ?? 12,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  return {
    docs: result.docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      excerpt: doc.excerpt ?? null,
      publishedAt: doc.publishedAt ?? null,
      author: doc.author ?? null,
    })),
    totalPages: result.totalPages,
    page: result.page ?? 1,
  };
}

export async function getArticleBySlug(
  slug: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<{
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  publishedAt: string | null;
  author: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  heroImageUrl: string | null;
  faq: Array<{ question: string; answer: string }>;
} | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "articles",
    where: { slug: { equals: slug }, status: { equals: "published" } },
    limit: 1,
    depth: 1,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  const doc = result.docs[0];
  if (doc === undefined) return null;
  return {
    id: String(doc.id),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt ?? null,
    content: doc.content,
    publishedAt: doc.publishedAt ?? null,
    author: doc.author ?? null,
    metaTitle: doc.metaTitle ?? null,
    metaDescription: doc.metaDescription ?? null,
    heroImageUrl: mediaToAbsoluteUrl(doc.imageHero),
    faq:
      doc.faq?.map((item: { question: string; answer: string }) => ({
        question: item.question,
        answer: item.answer,
      })) ?? [],
  };
}

/** Dedupes Payload fetch when the same article is read in page, metadata, and OG image. */
export const getArticleBySlugCached = cache(getArticleBySlug);

// --- Categories ---

export async function getCategories(
  locale: AppLocale = DEFAULT_LOCALE,
): Promise<Array<{ slug: string; name: string; color: string | null }>> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "categories",
    sort: "name",
    limit: 50,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  });
  return result.docs.map((doc) => ({
    slug: doc.slug,
    name: doc.name,
    color: doc.color ?? null,
  }));
}
