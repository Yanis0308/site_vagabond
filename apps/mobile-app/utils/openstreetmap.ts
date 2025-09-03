/**
 * Parse OSM ID format like "OSM-W-45421" and return the appropriate OSM URL
 * @param osmId - Our OSM ID in format "OSM-{Type}-{Number}"
 * @returns The OSM URL for the entity type
 */
export function getOsmUrl(osmId: string): string | null {
  const parts = osmId.split("-");

  // Check if it's our OSM ID format
  if (!osmId.startsWith("OSM-") || parts.length < 3) {
    return null;
  }

  // Extract type and number from "OSM-{Type}-{Number}"
  const type = parts[1];
  const number = parts[2];

  switch (type) {
    case "N":
      return `https://www.openstreetmap.org/node/${number}`;
    case "W":
      return `https://www.openstreetmap.org/way/${number}`;
    case "R":
      return `https://www.openstreetmap.org/relation/${number}`;
    default:
      return null;
  }
}
