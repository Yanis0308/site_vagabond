import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { RelatedArticles } from "@/components/blog/related-articles";
import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { FaqSection } from "@/components/faq-section";
import { blogPostingSchema, JsonLd } from "@/lib/json-ld";
import { type AppLocale } from "@/lib/locales";
import { getArticleBySlugCached, getPublishedArticles } from "@/lib/payload";
import { estimateReadingTime } from "@/lib/reading-time";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const { docs } = await getPublishedArticles({ limit: 100 });
  return docs.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as AppLocale;
  const article = await getArticleBySlugCached(slug, locale);
  if (article === null) return {};
  return {
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt ?? undefined,
  };
}

export default async function ArticlePage({
  params,
}: Props): Promise<ReactNode> {
  const { slug } = await params;
  const t = await getTranslations("blog");
  const locale = (await getLocale()) as AppLocale;
  const article = await getArticleBySlugCached(slug, locale);

  if (article === null) {
    notFound();
  }

  const readingTime = estimateReadingTime(article.content);

  const { docs: relatedArticles } = await getPublishedArticles({
    limit: 4,
    locale,
  });
  const related = relatedArticles.filter((a) => a.slug !== slug).slice(0, 3);

  const schema = blogPostingSchema({
    title: article.title,
    description: article.excerpt ?? article.title,
    pathname: `/blog/${slug}`,
    locale,
    datePublished: article.publishedAt,
    author: article.author,
    image: article.heroImageUrl,
  });

  return (
    <>
      <JsonLd data={schema} />
      <article className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <BreadcrumbSeo
            items={[
              { label: "Accueil", href: "/" },
              { label: "Blog", href: "/blog" },
              { label: article.title },
            ]}
          />

          {/* Meta */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-typography-500">
            {article.publishedAt !== null ? (
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            ) : null}
            <span>·</span>
            <span>{t("readTime", { minutes: String(readingTime) })}</span>
            {article.author !== null ? (
              <>
                <span>·</span>
                <span>{article.author}</span>
              </>
            ) : null}
          </div>

          {/* Title */}
          <h1
            className="
              font-display text-3xl/tight font-bold text-foreground
              md:text-4xl
            "
          >
            {article.title}
          </h1>

          {/* TL;DR */}
          {article.excerpt !== null ? (
            <div className="mt-8 rounded-xl border-l-4 border-primary-500 bg-background-200 p-6">
              <p className="text-sm/relaxed font-medium text-typography-600">
                {article.excerpt}
              </p>
            </div>
          ) : null}

          {/* Content placeholder */}
          <div className="prose mt-8 max-w-none prose-neutral">
            <p className="text-typography-500 italic">
              Le contenu riche de cet article sera rendu via le serializer
              Lexical une fois le contenu créé dans Payload CMS.
            </p>
          </div>
        </div>
      </article>

      {/* FAQ */}
      {article.faq.length > 0 ? (
        <FaqSection title={t("faqTitle")} items={article.faq} />
      ) : null}

      {/* Related articles */}
      <RelatedArticles
        title={t("relatedTitle")}
        articles={related}
        locale={locale}
      />
    </>
  );
}
