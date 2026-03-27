import { SITE_URL_NORMALIZED } from "./site-absolute-url";

interface MediaLike {
  url?: string | null;
  sizes?: {
    og?: { url?: string | null };
    hero?: { url?: string | null };
    card?: { url?: string | null };
  };
}

/**
 * Resolves a populated Payload media document to an absolute HTTPS URL for JSON-LD / OG.
 */
export function mediaToAbsoluteUrl(
  media: MediaLike | number | null | undefined,
): string | null {
  if (media === null || media === undefined || typeof media === "number") {
    return null;
  }
  const pick =
    media.sizes?.og?.url ??
    media.sizes?.hero?.url ??
    media.sizes?.card?.url ??
    media.url ??
    null;
  if (pick === null || pick === "") {
    return null;
  }
  if (pick.startsWith("http://") || pick.startsWith("https://")) {
    return pick;
  }
  return `${SITE_URL_NORMALIZED}${pick.startsWith("/") ? pick : `/${pick}`}`;
}
