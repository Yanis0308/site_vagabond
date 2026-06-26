import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { CalendlyEmbed } from "@/components/calendly-embed";
import { ContactEmailMailtoLink } from "@/components/contact-email-mailto-link";
import { ContactForm } from "@/components/contact-form";
import { CopyEmailButton } from "@/components/copy-email-button";
import { FaqSection } from "@/components/faq-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { CompetitorComparisonTable } from "@/components/marketing/competitor-comparison-table";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { publicEnv } from "@/lib/config/public";
import {
  B2B_COMPARE_APPS,
  B2B_COMPARE_CRITERIA,
  B2B_COMPARE_MATRIX,
  toCompareAppKey,
  toCompareCriterionKey,
} from "@/lib/faq/b2b-competitor-matrix";

export const metadata: Metadata = {
  title: "Vagabond Pro — Pour les professionnels du tourisme",
  description:
    "Vagabond Pro donne aux offices de tourisme et collectivités les outils pour engager les visiteurs et mesurer l'impact de leur territoire.",
};

export default async function ProPage(): Promise<ReactNode> {
  const t = await getTranslations("pro");

  const faqItems = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
    { question: t("faq6Q"), answer: t("faq6A") },
  ];

  const compareFaqItems = [
    { question: t("compareFaq1Q"), answer: t("compareFaq1A") },
    { question: t("compareFaq2Q"), answer: t("compareFaq2A") },
    { question: t("compareFaq3Q"), answer: t("compareFaq3A") },
    { question: t("compareFaq4Q"), answer: t("compareFaq4A") },
    { question: t("compareFaq5Q"), answer: t("compareFaq5A") },
  ];

  const compareApps = B2B_COMPARE_APPS.map((id) => ({
    id,
    name: t(`compare${toCompareAppKey(id)}Name`),
    isHighlight: id === "vagabondPro",
  }));

  const compareCriteria = B2B_COMPARE_CRITERIA.map((id) => ({
    id,
    label: t(`compareCriterion${toCompareCriterionKey(id)}`),
    values: B2B_COMPARE_MATRIX[id],
  }));

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-28 text-center">
        <Particles quantity={25} size={0.9} color="#9b4dca" speed={0.12} />

        <BlurFade delay={0} className="relative z-10 mx-auto max-w-4xl">
          <div
            className="
              mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5
              text-sm font-medium text-primary-600
            "
          >
            <span className="size-2 rounded-full bg-primary-500" />
            Vagabond Pro
          </div>

          <h1
            className="
              font-display text-5xl/tight font-bold text-foreground
              md:text-6xl
            "
          >
            {t("heroTitle")}
          </h1>

          <p
            className="
              mx-auto mt-6 max-w-2xl text-lg text-typography-600
              md:text-xl
            "
          >
            {t("heroSubtitle")}
          </p>

          <div className="relative mt-10 inline-block rounded-full">
            <a href="#contact">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full px-10 py-3 text-base"
              >
                {t("heroCta")}
              </Button>
            </a>
            <BorderBeam size={70} duration={7} />
          </div>
        </BlurFade>
      </section>

      {/* ── References — Marquee ── */}
      <TrustBar label={t("referencesTitle")} subtitle={t("referencesText")} />

      {/* ── Contact ── */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <BlurFade delay={0}>
            <h2
              className="
                mb-2 text-center font-display text-3xl font-bold text-foreground
                md:text-4xl
              "
            >
              {t("contactTitle")}
            </h2>
            <p className="mb-10 text-center text-typography-600">
              {t("contactSubtitle")}
            </p>
          </BlurFade>

          <div
            className="
              grid items-start gap-8
              lg:grid-cols-2
            "
          >
            <BlurFade delay={0.05}>
              <ContactForm className="size-full text-left" />
            </BlurFade>

            <BlurFade delay={0.1}>
              <CalendlyEmbed
                title={t("calendlyTitle")}
                subtitle={t("calendlySubtitle")}
              />
            </BlurFade>
          </div>

          <BlurFade delay={0.15}>
            <div
              className="
                mt-8 flex flex-col items-center justify-center rounded-2xl border border-background-200 bg-background-50
                px-8 py-10 text-center
              "
            >
              <p className="text-sm text-typography-500">
                {t("contactEmailLabel")}
              </p>
              <ContactEmailMailtoLink
                href="mailto:contact@vagabond.gg"
                page="pro"
                className="mt-3 block text-2xl font-bold text-foreground"
              >
                contact@vagabond.gg
              </ContactEmailMailtoLink>
              <CopyEmailButton
                email="contact@vagabond.gg"
                label={t("contactCopyButton")}
                copiedLabel={t("contactCopiedButton")}
                analyticsPage="pro"
              />

              <div className="mt-6 w-full max-w-md border-t border-background-200 pt-6">
                <p className="text-sm text-typography-500">
                  {t("contactLinkedinLabel")}
                </p>
                <a
                  href={publicEnv.CEO_LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    mt-3 inline-flex items-center gap-2 text-lg font-semibold text-foreground
                    hover:underline
                  "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5 text-[#0A66C2]"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Cyril Bauduin — CEO
                </a>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection
        title={t("faqTitle")}
        items={faqItems}
        columns={2}
        className="bg-background-100"
      />

      <CompetitorComparisonTable
        title={t("compareTitle")}
        subtitle={t("compareSubtitle")}
        colCriterion={t("compareColCriterion")}
        levelLabels={{
          yes: t("compareYes"),
          no: t("compareNo"),
        }}
        apps={compareApps}
        criteria={compareCriteria}
      />

      <FaqSection
        title={t("compareFaqTitle")}
        items={compareFaqItems}
        columns={2}
        className="bg-background-100 py-10"
        enableJsonLd={false}
      />
    </>
  );
}
