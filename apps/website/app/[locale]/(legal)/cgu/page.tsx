import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { LegalDocument } from "@/components/legal/legal-document";
import { CGU_SECTIONS } from "@/lib/legal-sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");

  return {
    title: t("cguTitle"),
    description: t("cguMetaDescription"),
  };
}

export default async function CguPage(): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <LegalDocument
      t={t}
      titleKey="cguTitle"
      breadcrumbLabelKey="cguTitle"
      sections={CGU_SECTIONS}
      currentPage="cgu"
    />
  );
}
