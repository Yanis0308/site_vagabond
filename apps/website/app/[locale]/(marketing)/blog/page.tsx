import { type Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { ArticleCard } from "@/components/article-card";
import { CategoryFilter } from "@/components/blog/category-filter";
import { type AppLocale } from "@/lib/locales";
import { getCategories, getPublishedArticles } from "@/lib/payload";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Le magazine de l'exploration — guides, gamification touristique, conseils de voyage et actualités Vagabond.",
};

interface Props {
  searchParams: Promise<{ categorie?: string }>;
}

export default async function BlogPage({
  searchParams,
}: Props): Promise<ReactNode> {
  const params = await searchParams;
  const t = await getTranslations("blog");
  const locale = (await getLocale()) as AppLocale;
  const categories = await getCategories(locale);
  const activeCategory = params.categorie ?? null;

  const { docs: articles } = await getPublishedArticles({
    category: activeCategory ?? undefined,
    limit: 12,
    locale,
  });

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <h1
          className="
            font-display text-3xl font-bold text-foreground
            md:text-4xl
          "
        >
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-typography-600">{t("subtitle")}</p>

        <div className="mt-8">
          <CategoryFilter
            categories={categories}
            activeSlug={activeCategory}
            allLabel={t("allCategories")}
          />
        </div>

        {articles.length > 0 ? (
          <div
            className="
              mt-8 grid grid-cols-1 gap-6
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {articles.map((article) => (
              <ArticleCard
                key={article.slug}
                slug={article.slug}
                title={article.title}
                excerpt={article.excerpt}
                publishedAt={article.publishedAt}
                author={article.author}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-lg text-typography-500">
            {t("noArticles")}
          </p>
        )}
      </div>
    </section>
  );
}
