export const POI_ENRICHED_VERSION = 1 as const;

export const PROCESSING_RESULT_VERSION_SCRAPER_MAPS = 1 as const;
export const PROCESSING_RESULT_VERSION_SCRAPER_WEB = 1 as const;
export const PROCESSING_RESULT_VERSION_LLM = 1 as const;
export const PROCESSING_RESULT_VERSION_WIKIDATA = 1 as const;
export const PROCESSING_RESULT_VERSION_WIKIPEDIA = 1 as const;

// Helper pour obtenir la version selon le type
export function getProcessingResultVersion(
  type: "scraper-maps" | "scraper-web" | "llm" | "wikidata" | "wikipedia",
): number {
  switch (type) {
    case "scraper-maps":
      return PROCESSING_RESULT_VERSION_SCRAPER_MAPS;
    case "scraper-web":
      return PROCESSING_RESULT_VERSION_SCRAPER_WEB;
    case "llm":
      return PROCESSING_RESULT_VERSION_LLM;
    case "wikidata":
      return PROCESSING_RESULT_VERSION_WIKIDATA;
    case "wikipedia":
      return PROCESSING_RESULT_VERSION_WIKIPEDIA;
  }
}
