"use client";

import React, { type ReactNode } from "react";

import { useTranslationClient } from "@/app/i18n/client";
import {
  AppFeatures,
  CountdownTimer,
  Hero,
  WhatIsVagabond,
} from "@/components/home";

interface HomePageProps {
  params: Promise<{
    lng: string;
  }>;
}

export default function HomePage({ params }: HomePageProps): ReactNode {
  const resolvedParams = React.use(params);
  const { lng } = resolvedParams;

  const { t } = useTranslationClient(lng, ["home"]);

  const emojis = {
    compass: "🧭",
    star: "⭐",
    arrow: "➡️",
    lock: "🌍",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-primary-50">
      <div className="mx-auto max-w-4xl px-4 pt-12 md:pt-20">
        <Hero lng={lng} t={t} />

        <CountdownTimer
          labels={{
            eventTitle: t("comingSoon.eventTitle", { ns: "home" }),
            daysLabel: t("comingSoon.daysLabel", { ns: "home" }),
            hoursLabel: t("comingSoon.hoursLabel", { ns: "home" }),
            minutesLabel: t("comingSoon.minutesLabel", { ns: "home" }),
            secondsLabel: t("comingSoon.secondsLabel", { ns: "home" }),
            emailPrompt: t("comingSoon.emailPrompt", { ns: "home" }),
            buttonText: t("comingSoon.buttonText", { ns: "home" }),
            successMessage: t("comingSoon.successMessage", { ns: "home" }),
            errorMessage: t("comingSoon.errorMessage", { ns: "home" }),
            placeHolderText: t("comingSoon.placeHolderText", { ns: "home" }),
          }}
        />

        <WhatIsVagabond
          texts={{
            title: t("whatIsVagabond.title", { ns: "home" }),
            description1: t("whatIsVagabond.description1", { ns: "home" }),
            description2: t("whatIsVagabond.description2", { ns: "home" }),
            description3: t("whatIsVagabond.description3", { ns: "home" }),
            goal: t("whatIsVagabond.goal", { ns: "home" }),
          }}
          compass={emojis.compass}
        />

        <AppFeatures
          texts={{
            title: t("appForTravelers.title", { ns: "home" }),
            feature1: t("appForTravelers.feature1", { ns: "home" }),
            feature2: t("appForTravelers.feature2", { ns: "home" }),
            feature3: t("appForTravelers.feature3", { ns: "home" }),
            feature4: t("appForTravelers.feature4", { ns: "home" }),
            footer: t("appForTravelers.footer", { ns: "home" }),
          }}
          star={emojis.star}
          arrow={emojis.arrow}
          lock={emojis.lock}
        />
      </div>
    </div>
  );
}
