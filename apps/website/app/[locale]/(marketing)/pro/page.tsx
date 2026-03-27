import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { BentoCard, BentoGrid } from "@/components/bento-grid";
import { CalendlyEmbed } from "@/components/calendly-embed";
import { ContactEmailMailtoLink } from "@/components/contact-email-mailto-link";
import { CopyEmailButton } from "@/components/copy-email-button";
import { FaqSection } from "@/components/faq-section";
import { TrustBar } from "@/components/landing/trust-bar";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { publicEnv } from "@/lib/config/public";

export const metadata: Metadata = {
  title: "Vagabond Pro — Pour les professionnels du tourisme",
  description:
    "Vagabond Pro donne aux offices de tourisme et collectivités les outils pour engager les visiteurs et mesurer l'impact de leur territoire.",
};

const PAS_ITEMS = [
  {
    colorClass: "text-destructive",
    spotlightColor: "rgba(239, 68, 68, 0.07)",
    titleKey: "problemTitle" as const,
    textKey: "problemText" as const,
  },
  {
    colorClass: "text-secondary-500",
    spotlightColor: "rgba(249, 115, 22, 0.07)",
    titleKey: "agitationTitle" as const,
    textKey: "agitationText" as const,
  },
  {
    colorClass: "text-primary-500",
    spotlightColor: "rgba(155, 77, 202, 0.07)",
    titleKey: "solutionTitle" as const,
    textKey: "solutionText" as const,
  },
] as const;

export default async function ProPage(): Promise<ReactNode> {
  const t = await getTranslations("pro");

  const features = [
    { title: t("feat1Title"), description: t("feat1Desc") },
    { title: t("feat2Title"), description: t("feat2Desc") },
    { title: t("feat3Title"), description: t("feat3Desc") },
    { title: t("feat4Title"), description: t("feat4Desc") },
  ];

  const faqItems = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
    { question: t("faq6Q"), answer: t("faq6A") },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-28 text-center">
        <Particles quantity={25} size={0.9} color="#9b4dca" speed={0.12} />

        <BlurFade delay={0} className="relative z-10 mx-auto max-w-4xl">
          <div className="border-primary-200 bg-primary-50 text-primary-600 mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
            <span className="bg-primary-500 size-2 rounded-full" />
            Vagabond Pro
          </div>

          <h1 className="font-display text-foreground text-5xl leading-tight font-bold md:text-6xl">
            {t("heroTitle")}
          </h1>

          <p className="text-typography-600 mx-auto mt-6 max-w-2xl text-lg md:text-xl">
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

      {/* ── PAS — Problem / Agitation / Solution ── */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {PAS_ITEMS.map((item) => (
            <BlurFade key={item.titleKey} delay={0}>
              <SpotlightCard
                className="border-background-200 bg-background-50 h-full rounded-2xl border p-6"
                spotlightColor={item.spotlightColor}
              >
                <h2
                  className={`font-display text-xl font-bold ${item.colorClass}`}
                >
                  {t(item.titleKey)}
                </h2>
                <p className="text-typography-600 mt-3 text-sm leading-relaxed">
                  {t(item.textKey)}
                </p>
              </SpotlightCard>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── Features — Bento ── */}
      <section className="bg-background-100 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <BlurFade delay={0}>
            <BentoGrid>
              {features.map((feat, i) => (
                <BentoCard
                  key={feat.title}
                  span={i === 0 || i === 3 ? "large" : "small"}
                >
                  <h3 className="font-display text-foreground text-lg font-bold">
                    {feat.title}
                  </h3>
                  <p className="text-typography-600 mt-2 text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </BentoCard>
              ))}
            </BentoGrid>
          </BlurFade>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0}>
            <h2 className="font-display text-foreground mb-2 text-center text-3xl font-bold md:text-4xl">
              {t("contactTitle")}
            </h2>
            <p className="text-typography-600 mb-10 text-center">
              {t("contactSubtitle")}
            </p>
          </BlurFade>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Email + LinkedIn card */}
            <BlurFade delay={0.1}>
              <div className="border-background-200 bg-background-50 flex h-full flex-col items-center justify-center rounded-2xl border px-8 py-12">
                <p className="text-typography-500 text-sm">
                  {t("contactEmailLabel")}
                </p>
                <ContactEmailMailtoLink
                  href="mailto:contact@vagabond.gg"
                  page="pro"
                  className="text-foreground mt-3 block text-2xl font-bold"
                >
                  contact@vagabond.gg
                </ContactEmailMailtoLink>
                <CopyEmailButton
                  email="contact@vagabond.gg"
                  label={t("contactCopyButton")}
                  copiedLabel={t("contactCopiedButton")}
                  analyticsPage="pro"
                />

                <div className="border-background-200 mt-6 w-full border-t pt-6 text-center">
                  <p className="text-typography-500 text-sm">
                    {t("contactLinkedinLabel")}
                  </p>
                  <a
                    href={publicEnv.CEO_LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground mt-3 inline-flex items-center gap-2 text-lg font-semibold hover:underline"
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

            {/* Calendly */}
            <BlurFade delay={0.2}>
              <CalendlyEmbed
                title={t("calendlyTitle")}
                subtitle={t("calendlySubtitle")}
              />
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FaqSection
        title={t("faqTitle")}
        items={faqItems}
        columns={2}
        className="bg-background-100"
      />
    </>
  );
}
