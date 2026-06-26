import { type ReactNode } from "react";

import { publicEnv } from "./config/public";
import { type AppLocale } from "./locales";
import { SITE_URL_NORMALIZED, siteAbsoluteUrl } from "./site-absolute-url";

function publisherOrganization(): Record<string, unknown> {
  return {
    "@type": "Organization",
    name: "Vagabond",
    url: SITE_URL_NORMALIZED,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL_NORMALIZED}/images/logo.svg`,
    },
  };
}

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vagabond",
    url: SITE_URL_NORMALIZED,
    logo: `${SITE_URL_NORMALIZED}/images/logo.svg`,
    description:
      "Application française de tourisme gamifié. Explorez la France avec une carte à gratter digitale, des défis et des badges.",
    foundingDate: "2024-01-01",
    foundingLocation: { "@type": "Place", name: "France" },
    sameAs: [
      "https://www.instagram.com/vagabond.gg",
      "https://www.linkedin.com/company/vagabond-gg",
    ],
  };
}

export function mobileApplicationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Vagabond",
    applicationCategory: "TravelApplication",
    operatingSystem: ["iOS", "Android"],
    description:
      "Application de tourisme gamifié pour explorer la France. Carte à gratter digitale, 140 000+ POIs, défis géolocalisés, badges et carnet de voyage.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    downloadUrl: [publicEnv.APP_STORE_URL, publicEnv.GOOGLE_PLAY_URL],
    inLanguage: [
      "fr",
      "en",
      "de",
      "nl",
      "it",
      "es",
      "pt",
      "zh",
      "ja",
      "pl",
      "ko",
    ],
  };
}

export function faqPageSchema(
  items: Array<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function blogPostingSchema(data: {
  title: string;
  description: string;
  /** Site pathname e.g. `/blog/my-slug` (no locale prefix). */
  pathname: string;
  locale: AppLocale;
  datePublished: string | null;
  dateModified?: string | null;
  author: string | null;
  image?: string | null;
}): Record<string, unknown> {
  const canonicalUrl = siteAbsoluteUrl(data.pathname, data.locale);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title,
    description: data.description,
    url: canonicalUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    ...(data.datePublished !== null
      ? { datePublished: data.datePublished }
      : {}),
    ...(data.dateModified !== undefined && data.dateModified !== null
      ? { dateModified: data.dateModified }
      : {}),
    ...(data.author !== null
      ? { author: { "@type": "Person", name: data.author } }
      : {}),
    ...(data.image !== undefined && data.image !== null
      ? { image: data.image }
      : {}),
    publisher: publisherOrganization(),
  };
}

export function breadcrumbListSchema(
  items: Array<{ label: string; href?: string }>,
  locale: AppLocale,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href !== undefined
        ? { item: siteAbsoluteUrl(item.href, locale) }
        : {}),
    })),
  };
}

export function explorerRegionsItemListSchema(options: {
  regions: Array<{ slug: string; nom: string }>;
  locale: AppLocale;
  name: string;
}): Record<string, unknown> {
  const { regions, locale, name } = options;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: regions.length,
    itemListElement: regions.map((region, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: region.nom,
      item: siteAbsoluteUrl(`/explorer/${region.slug}`, locale),
    })),
  };
}

export function touristDestinationSchema(options: {
  name: string;
  description: string;
  pathname: string;
  locale: AppLocale;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: options.name,
    description: options.description,
    url: siteAbsoluteUrl(options.pathname, options.locale),
  };
}

/**
 * Renders a JSON-LD script tag for structured data.
 * The data parameter must be a trusted object constructed from
 * application-controlled values (not user input).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }): ReactNode {
  const jsonString = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\//g, "\\u002f");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
