"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { type ReactNode } from "react";

import { routing } from "@/i18n/routing";
import { trackAppStoreClick } from "@/lib/analytics";
import { publicEnv } from "@/lib/config/public";
import { cn } from "@/lib/utils";

type Locale = (typeof routing.locales)[number];

const BADGE_LABELS: Record<Locale, { appStore: string; googlePlay: string }> = {
  fr: {
    appStore: "Télécharger sur l'App Store",
    googlePlay: "Disponible sur Google Play",
  },
  en: {
    appStore: "Download on the App Store",
    googlePlay: "Get it on Google Play",
  },
  de: {
    appStore: "Laden im App Store",
    googlePlay: "Jetzt bei Google Play",
  },
  nl: {
    appStore: "Download in de App Store",
    googlePlay: "Ontdek het op Google Play",
  },
  it: {
    appStore: "Scarica dall'App Store",
    googlePlay: "Disponibile su Google Play",
  },
  es: {
    appStore: "Descargar en el App Store",
    googlePlay: "Disponible en Google Play",
  },
  pt: {
    appStore: "Descarregar na App Store",
    googlePlay: "Disponível no Google Play",
  },
  zh: {
    appStore: "从 App Store 下载",
    googlePlay: "在 Google Play 上获取",
  },
  ja: {
    appStore: "App Store からダウンロード",
    googlePlay: "Google Play で手に入れよう",
  },
  pl: {
    appStore: "Pobierz z App Store",
    googlePlay: "Pobierz z Google Play",
  },
  ko: {
    appStore: "App Store에서 다운로드",
    googlePlay: "Google Play에서 받기",
  },
};

interface Props {
  className?: string;
  variant?: "default" | "compact";
  /** Where badges are shown (used for analytics). */
  position?: string;
}

export function AppStoreBadges({
  className,
  variant = "default",
  position = "badges",
}: Props): ReactNode {
  const rawLocale = useLocale();
  const locale: Locale = (routing.locales as readonly string[]).includes(
    rawLocale,
  )
    ? (rawLocale as Locale)
    : routing.defaultLocale;
  const size =
    variant === "compact"
      ? { width: 135, height: 40 }
      : { width: 160, height: 48 };

  const labels = BADGE_LABELS[locale];

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <a
        href={publicEnv.APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.appStore}
        onClick={(): void => {
          trackAppStoreClick("ios", position);
        }}
      >
        <Image
          src={`/images/badges/app-store-${locale}.svg`}
          alt={labels.appStore}
          width={size.width}
          height={size.height}
        />
      </a>
      <a
        href={publicEnv.GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.googlePlay}
        onClick={(): void => {
          trackAppStoreClick("android", position);
        }}
      >
        <Image
          src={`/images/badges/google-play-${locale}.svg`}
          alt={labels.googlePlay}
          width={size.width}
          height={size.height}
        />
      </a>
    </div>
  );
}
