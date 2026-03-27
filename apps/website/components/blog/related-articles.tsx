import { type ReactNode } from "react";

import { ArticleCard } from "@/components/article-card";
import { estimateReadingTime } from "@/lib/reading-time";

interface Article {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  author: string | null;
  content?: unknown;
}

interface Props {
  title: string;
  articles: Article[];
  locale?: string;
}

export function RelatedArticles({ title, articles, locale }: Props): ReactNode {
  if (articles.length === 0) return null;

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-foreground mb-6 text-2xl font-bold">
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.slug}
              slug={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              publishedAt={article.publishedAt}
              author={article.author}
              readingTime={estimateReadingTime(article.content)}
              locale={locale}
              linkContext="related"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
