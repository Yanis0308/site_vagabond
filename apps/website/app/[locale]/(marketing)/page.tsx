import { type Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { FaqSection } from "@/components/faq-section";
import { B2bTeaserSection } from "@/components/landing/b2b-teaser-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MapSection } from "@/components/landing/map-section";
import { ScreenshotsSection } from "@/components/landing/screenshots-section";
import { StatsSection } from "@/components/landing/stats-section";
import { TrustBar } from "@/components/landing/trust-bar";
import {
  JsonLd,
  mobileApplicationSchema,
  organizationSchema,
} from "@/lib/json-ld";
import { type AppLocale, DEFAULT_LOCALE, LOCALES } from "@/lib/locales";
import { getRegions } from "@/lib/payload";
import { generateTapItQrCodeDataUrl } from "@/lib/qr-code";

export const revalidate = 86400;
import { siteAbsoluteUrl } from "@/lib/site-absolute-url";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = siteAbsoluteUrl("/", l);
  }
  return {
    title: "Vagabond - Explore la France comme jamais",
    description:
      "L'app de tourisme gamifié pour explorer la France. Carte à gratter digitale, 100 000+ lieux à découvrir, défis, badges et carnet de voyage. Gratuit sur iOS et Android.",
    alternates: {
      canonical: siteAbsoluteUrl("/", locale),
      languages: {
        ...languages,
        "x-default": siteAbsoluteUrl("/", DEFAULT_LOCALE),
      },
    },
  };
}

export default async function HomePage(): Promise<ReactNode> {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as AppLocale;
  const regions = await getRegions(locale);

  const heroQrDataUrl = await generateTapItQrCodeDataUrl({ width: 200 });

  const steps = [
    {
      icon: t("step1Icon"),
      number: "1",
      title: t("step1Title"),
      description: t("step1Desc"),
    },
    {
      icon: t("step2Icon"),
      number: "2",
      title: t("step2Title"),
      description: t("step2Desc"),
    },
    {
      icon: t("step3Icon"),
      number: "3",
      title: t("step3Title"),
      description: t("step3Desc"),
    },
  ];

  const screenshots = [
    {
      src: "/images/screenshots/screen-1.png",
      alt: t("screenshot1"),
      caption: t("screenshot1"),
    },
    {
      src: "/images/screenshots/screen-2.png",
      alt: t("screenshot2"),
      caption: t("screenshot2"),
    },
    {
      src: "/images/screenshots/screen-3.png",
      alt: t("screenshot3"),
      caption: t("screenshot3"),
    },
    {
      src: "/images/screenshots/screen-4.png",
      alt: t("screenshot4"),
      caption: t("screenshot4"),
    },
    {
      src: "/images/screenshots/screen-5.png",
      alt: t("screenshot5"),
      caption: t("screenshot5"),
    },
  ];

  const stats = [
    { value: 100000, suffix: "+", label: t("statPois") },
    { value: 36000, suffix: "+", label: t("statVilles") },
    { value: 13, suffix: "", label: t("statRegions") },
    { value: 5, suffix: "/5", label: t("statRating") },
  ];

  const faqItems = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
    { question: t("faq6Q"), answer: t("faq6A") },
    { question: t("faq7Q"), answer: t("faq7A") },
    { question: t("faq8Q"), answer: t("faq8A") },
  ];

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={mobileApplicationSchema()} />

      <HeroSection
        badge={t("heroBadge")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        socialProof={t("heroSocialProof")}
        qrLabel={t("heroQrLabel")}
        qrDataUrl={heroQrDataUrl}
        qrAlt={t("deeplinkQrAlt")}
        mention={t("heroMention")}
      />

      <TrustBar label={t("trustLabel")} />

      <HowItWorksSection title={t("howItWorksTitle")} steps={steps} />

      <ScreenshotsSection
        title={t("screenshotsTitle")}
        screenshots={screenshots}
      />

      <StatsSection title={t("statsTitle")} stats={stats} />

      <MapSection
        title={t("mapTitle")}
        description={t("mapDesc")}
        ctaLabel={t("mapCta")}
        regions={regions}
        placesLabel={t("statPois")}
      />

      <B2bTeaserSection
        title={t("b2bTitle")}
        description={t("b2bDesc")}
        features={t("b2bFeatures")}
        ctaLabel={t("b2bCta")}
      />

      <FaqSection title={t("faqTitle")} items={faqItems} columns={2} />
    </>
  );
}
