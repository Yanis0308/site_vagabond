import "../globals.css";

import { Analytics } from "@vercel/analytics/next";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { type ReactNode } from "react";

import { SmartBanner } from "@/components/smart-banner";
import { routing } from "@/i18n/routing";
import {
  openGraphAlternateLocales,
  openGraphLocaleTag,
} from "@/lib/open-graph-locale";
import { cn } from "@/lib/utils";

import { bodyFont, displayFont } from "../fonts";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!hasLocale(routing.locales, localeParam)) {
    return {};
  }

  return {
    metadataBase: new URL("https://www.vagabond.gg"),
    title: {
      default: "Vagabond — Explore la France comme jamais",
      template: "%s | Vagabond",
    },
    description:
      "L'app de tourisme gamifié pour explorer la France. Carte à gratter digitale, 140 000+ lieux à découvrir, défis, badges et carnet de voyage. Gratuit sur iOS et Android.",
    keywords: [
      "tourisme gamifié",
      "explorer France",
      "carte à gratter voyage",
      "carnet voyage digital",
      "app tourisme France",
    ],
    authors: [{ name: "Vagabond", url: "https://www.vagabond.gg" }],
    creator: "Vagabond",
    openGraph: {
      type: "website",
      locale: openGraphLocaleTag(localeParam),
      alternateLocale: openGraphAlternateLocales(localeParam),
      siteName: "Vagabond",
    },
    twitter: {
      card: "summary_large_image",
      creator: "@vagabondgg",
    },
    robots: { index: true, follow: true },
    other: {
      "apple-itunes-app": "app-id=6737132413",
      "google-play-app": "app-id=com.vagabond.explore.tourism",
      "smartbanner:title": "Vagabond",
      "smartbanner:author": "Vagabond",
      "smartbanner:price": "Gratuit",
      "smartbanner:price-suffix-apple": " - App Store",
      "smartbanner:price-suffix-google": " - Google Play",
      "smartbanner:icon-apple":
        "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/app-icon/6737132413/AppIcon-1x_U007emarketing-0-7-0-85-220-0.png/230x0w.webp",
      "smartbanner:icon-google":
        "https://play-lh.googleusercontent.com/app-icon/com.vagabond.explore.tourism",
      "smartbanner:button": "VOIR",
      "smartbanner:button-url-apple":
        "https://apps.apple.com/fr/app/vagabond-voyage-en-france/id6737132413",
      "smartbanner:button-url-google":
        "https://play.google.com/store/apps/details?id=com.vagabond.explore.tourism&hl=fr",
      "smartbanner:enabled-platforms": "android,ios",
      "smartbanner:close-label": "Fermer",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Props): Promise<ReactNode> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={cn(
        "antialiased",
        displayFont.variable,
        bodyFont.variable,
        "font-sans",
      )}
    >
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="Vagabond" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="overflow-x-hidden">
        <SmartBanner />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
