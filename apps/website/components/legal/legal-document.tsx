import { type getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { LegalCrossLinks } from "@/components/legal/legal-cross-links";
import {
  type LegalPageTitleKey,
  type LegalSection,
} from "@/lib/legal-sections";

type LegalTranslator = Awaited<ReturnType<typeof getTranslations>>;

interface Props {
  t: LegalTranslator;
  titleKey: LegalPageTitleKey;
  breadcrumbLabelKey: LegalPageTitleKey;
  sections: LegalSection[];
  currentPage: "mentions" | "conf" | "cgu";
}

export function LegalDocument({
  t,
  titleKey,
  breadcrumbLabelKey,
  sections,
  currentPage,
}: Props): ReactNode {
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
          <p className="mb-6 text-sm text-typography-500">{t("lastUpdated")}</p>
          <article className="prose max-w-none prose-neutral">
            <h1>{t(titleKey)}</h1>

            {sections.map((section) => (
              <section key={section.titleKey}>
                <h2>{t(section.titleKey)}</h2>
                <p className="whitespace-pre-line">{t(section.bodyKey)}</p>
              </section>
            ))}
          </article>

          <LegalCrossLinks t={t} currentPage={currentPage} />
        </div>
      </section>
    </div>
  );
}
