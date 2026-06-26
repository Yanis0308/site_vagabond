import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { LegalDocument } from "@/components/legal/legal-document";
import { MENTIONS_SECTIONS } from "@/lib/legal-sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");

  return {
    title: t("mentionsTitle"),
    description: t("mentionsMetaDescription"),
  };
}

export default async function MentionsLegalesPage(): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <LegalDocument
      t={t}
      titleKey="mentionsTitle"
      breadcrumbLabelKey="mentionsTitle"
      sections={MENTIONS_SECTIONS}
      currentPage="mentions"
    />
  );
}
