import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { LegalDocument } from "@/components/legal/legal-document";
import { PRIVACY_SECTIONS } from "@/lib/legal-sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");

  return {
    title: t("confTitle"),
    description: t("confMetaDescription"),
  };
}

export default async function ConfidentialitePage(): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <LegalDocument
      t={t}
      titleKey="confTitle"
      breadcrumbLabelKey="confTitle"
      sections={PRIVACY_SECTIONS}
      currentPage="conf"
    />
  );
}
