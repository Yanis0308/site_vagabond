import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { getArticleBySlugCached } from "@/lib/payload";

export const alt = "Vagabond — Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE_MAX_LENGTH = 72;
const EXCERPT_MAX_LENGTH = 160;

interface OgProps {
  params: Promise<{ locale: string; slug: string }>;
}

function fallbackOg(title: string): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#5d2e79",
        color: "white",
        fontSize: 64,
        fontWeight: 700,
      }}
    >
      {title}
    </div>,
    { ...size },
  );
}

export default async function Image({
  params,
}: OgProps): Promise<ImageResponse> {
  const { locale: localeParam, slug } = await params;

  if (!hasLocale(routing.locales, localeParam)) {
    return fallbackOg("Vagabond");
  }

  const article = await getArticleBySlugCached(slug, localeParam);

  if (article === null) {
    return fallbackOg("Vagabond — Blog");
  }

  const displayTitle = (article.metaTitle ?? article.title).slice(
    0,
    TITLE_MAX_LENGTH,
  );
  const excerpt = article.excerpt;
  const excerptShort =
    excerpt !== null && excerpt.length > EXCERPT_MAX_LENGTH
      ? `${excerpt.slice(0, EXCERPT_MAX_LENGTH)}…`
      : excerpt;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 64,
        background:
          "linear-gradient(135deg, #5d2e79 0%, #9b4dca 55%, #ff5c5c 100%)",
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "white",
          lineHeight: 1.15,
          marginBottom: 24,
        }}
      >
        {displayTitle}
      </div>
      {excerptShort !== null ? (
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.35,
            maxWidth: 1000,
          }}
        >
          {excerptShort}
        </div>
      ) : null}
      <div
        style={{
          marginTop: "auto",
          fontSize: 26,
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        Vagabond — Blog
      </div>
    </div>,
    { ...size },
  );
}
