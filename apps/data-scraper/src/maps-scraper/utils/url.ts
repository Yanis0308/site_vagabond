/**
 * Build Google Maps search URL
 */
export function buildSearchURL(
  query: string,
  langCode: string,
  geoCoordinates?: string,
  zoom?: number,
): string {
  const encodedQuery = encodeURIComponent(query);

  if (geoCoordinates !== undefined && zoom !== undefined) {
    // Format with geographic coordinates
    const coords = geoCoordinates.replace(/\s/g, "");
    return `https://www.google.com/maps/search/${encodedQuery}/@${coords},${zoom}z?hl=${langCode}`;
  } else {
    // Simple format without coordinates
    return `https://www.google.com/maps/search/${encodedQuery}?hl=${langCode}`;
  }
}
