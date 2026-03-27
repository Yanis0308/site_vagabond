"use client";

import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { trackRelatedArticleClick } from "@/lib/analytics";

interface Props {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  author: string | null;
  categoryName?: string;
  categoryColor?: string;
  readingTime?: number;
  locale?: string;
  /** When `related`, tracks `related_article_click` on navigation. */
  linkContext?: "default" | "related";
}

export function ArticleCard({
  slug,
  title,
  excerpt,
  publishedAt,
  author,
  categoryName,
  categoryColor,
  readingTime,
  locale,
  linkContext = "default",
}: Props): ReactNode {
  return (
    <Link
      href={`/blog/${slug}`}
      onClick={(): void => {
        if (linkContext === "related") {
          trackRelatedArticleClick(slug);
        }
      }}
    >
      <Card className="hover:border-primary-400 h-full transition-all hover:shadow-lg">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            {categoryName !== undefined ? (
              <Badge
                variant="secondary"
                className="text-xs"
                style={
                  categoryColor !== undefined
                    ? {
                        backgroundColor: `${categoryColor}20`,
                        color: categoryColor,
                      }
                    : undefined
                }
              >
                {categoryName}
              </Badge>
            ) : null}
            {readingTime !== undefined ? (
              <span className="text-typography-500 text-xs">
                {readingTime} min
              </span>
            ) : null}
          </div>
          <h3 className="font-display text-foreground text-lg leading-tight font-bold">
            {title}
          </h3>
          {excerpt !== null ? (
            <p className="text-typography-600 line-clamp-2 text-sm">
              {excerpt}
            </p>
          ) : null}
          <div className="text-typography-500 mt-auto flex items-center gap-2 text-xs">
            {publishedAt !== null ? (
              <time dateTime={publishedAt}>
                {new Date(publishedAt).toLocaleDateString(locale ?? "fr", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            ) : null}
            {author !== null ? (
              <>
                <span>·</span>
                <span>{author}</span>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
