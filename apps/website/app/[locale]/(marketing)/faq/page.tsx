import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BreadcrumbSeo } from "@/components/breadcrumb-seo";
import { FaqSection } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes",
  description:
    "Toutes les réponses à vos questions sur Vagabond : application, carte à gratter, badges, compte, données et plus.",
};

export default async function FaqPage(): Promise<ReactNode> {
  const t = await getTranslations("faq");

  const categories = [
    {
      title: t("catApp"),
      items: Array.from({ length: 8 }, (_, i) => ({
        question: t(`app${String(i + 1)}Q`),
        answer: t(`app${String(i + 1)}A`),
      })),
    },
    {
      title: t("catGameplay"),
      items: Array.from({ length: 6 }, (_, i) => ({
        question: t(`gameplay${String(i + 1)}Q`),
        answer: t(`gameplay${String(i + 1)}A`),
      })),
    },
    {
      title: t("catAccount"),
      items: Array.from({ length: 5 }, (_, i) => ({
        question: t(`account${String(i + 1)}Q`),
        answer: t(`account${String(i + 1)}A`),
      })),
    },
    {
      title: t("catData"),
      items: Array.from({ length: 4 }, (_, i) => ({
        question: t(`data${String(i + 1)}Q`),
        answer: t(`data${String(i + 1)}A`),
      })),
    },
    {
      title: t("catPro"),
      items: Array.from({ length: 4 }, (_, i) => ({
        question: t(`pro${String(i + 1)}Q`),
        answer: t(`pro${String(i + 1)}A`),
      })),
    },
  ];

  return (
    <div className="bg-background-50">
      <section className="px-6 pt-12 pb-4">
        <div className="mx-auto max-w-5xl">
          <BreadcrumbSeo
            items={[
              { label: t("breadcrumbHome"), href: "/" },
              { label: t("title") },
            ]}
          />
          <h1
            className="
              mt-6 font-display text-3xl font-bold text-foreground
              md:text-4xl
            "
          >
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-typography-600">{t("subtitle")}</p>
        </div>
      </section>

      {categories.map((cat, index) => (
        <FaqSection
          key={cat.title}
          title={cat.title}
          items={cat.items}
          columns={2}
          className="py-10"
          enableJsonLd={index === 0}
        />
      ))}
    </div>
  );
}
