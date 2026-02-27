/** Processing result types — used in API code; DB column stays varchar */
export const PROCESSING_TYPES = [
  "scraper-maps",
  "scraper-web",
  "llm",
  "wikidata",
  "wikipedia",
  "jina-search",
  "jina-reader",
] as const;

export type ProcessingType = (typeof PROCESSING_TYPES)[number];

export interface CustomPoiCreateInput {
  id: string;
  source: "OSM";
  sourceId: string;
  filterLevel: "UNKNOWN" | "STRICT" | "STANDARD" | "INTERMEDIATE" | "LAXIST";
  coords: {
    latitude: number;
    longitude: number;
  };
}
