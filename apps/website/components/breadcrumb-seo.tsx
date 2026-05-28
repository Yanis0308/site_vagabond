import { getLocale } from "next-intl/server";
import { type ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { breadcrumbListSchema, JsonLd } from "@/lib/json-ld";
import { type AppLocale } from "@/lib/locales";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export async function BreadcrumbSeo({ items }: Props): Promise<ReactNode> {
  const locale = (await getLocale()) as AppLocale;
  return (
    <>
      <JsonLd data={breadcrumbListSchema(items, locale)} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-typography-500">
          {items.map((item, index) => (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 ? (
                <span className="text-typography-500" aria-hidden="true">
                  /
                </span>
              ) : null}
              {item.href !== undefined ? (
                <Link
                  href={item.href}
                  className="
                    transition-colors
                    hover:text-primary-500
                  "
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
