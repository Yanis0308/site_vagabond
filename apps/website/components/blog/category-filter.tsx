"use client";

import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { trackBlogCategorySelect } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface Category {
  slug: string;
  name: string;
  color: string | null;
}

interface Props {
  categories: Category[];
  activeSlug: string | null;
  allLabel: string;
}

export function CategoryFilter({
  categories,
  activeSlug,
  allLabel,
}: Props): ReactNode {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        onClick={(): void => {
          trackBlogCategorySelect(null);
        }}
      >
        <Badge
          variant={activeSlug === null ? "default" : "outline"}
          className={cn(
            "cursor-pointer px-4 py-1.5 text-sm",
            activeSlug === null && "bg-primary-500 text-white",
          )}
        >
          {allLabel}
        </Badge>
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/blog?categorie=${cat.slug}`}
          onClick={(): void => {
            trackBlogCategorySelect(cat.slug);
          }}
        >
          <Badge
            variant={activeSlug === cat.slug ? "default" : "outline"}
            className={cn(
              "cursor-pointer px-4 py-1.5 text-sm",
              activeSlug === cat.slug && "text-white",
            )}
            style={
              activeSlug === cat.slug && cat.color !== null
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            {cat.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
