import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { LegalCrossLinks } from "@/components/legal/legal-cross-links";
import { type LegalSection } from "@/lib/legal/sections";

interface Props {
  titleKey: string;
  breadcrumbLabelKey: string;
  sections: LegalSection[];
  currentPage: "mentions" | "conf" | "cgu";
}

export async function LegalDocument({
  titleKey,
  breadcrumbLabelKey,
  sections,
  currentPage,
}: Props): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <div className="bg-background-50">
      <section className="px-6 pt-12 pb-16">
        <div className="mx-auto max-w-3xl">
          <BreadcrumbSeo
            items={[
              { label: t("breadcrumbHome"), href: "/" },
              { label: t(breadcrumbLabelKey) },
            ]}
          />
          <article className="prose max-w-none prose-neutral">
            <h1>{t(titleKey)}</h1>
            <p className="not-prose text-sm text-typography-500">
              {t("lastUpdated")}
            </p>

            {sections.map((section) => (
              <section key={section.titleKey}>
                <h2>{t(section.titleKey)}</h2>
                <p className="whitespace-pre-line">{t(section.bodyKey)}</p>
              </section>
            ))}
          </article>

          <LegalCrossLinks currentPage={currentPage} />
        </div>
      </section>
    </div>
  );
}
