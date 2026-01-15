import { type jsonSchemas } from "@vagabond/shared-utils";
import { type GoogleMapsPlaceStrict } from "@vagabond/shared-utils";
import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";
import { getDistance } from "geolib";
import type { Static } from "typebox";

import { mapFunFactsToDbFormat } from "../utils/poi-enrichment.utils.js";
import { normalizeSearchText } from "../utils/text.js";
import type { GoogleMapsScrapeResponse } from "./http/data-scraper-client.js";
import type { JinaScrapeResponse } from "./http/jina-client.js";
import type { WikimediaResponse } from "./http/wikimedia-client.js";
import type { ProcessResult } from "./processing/processing-result-orchestrator.js";
import { ProcessingResultOrchestrator } from "./processing/processing-result-orchestrator.js";
import { GeminiLlmProcessor } from "./processing/processors/gemini-llm.processor.js";
import { GoogleMapsScrapingProcessor } from "./processing/processors/google-maps-scraping.processor.js";
import { JinaWebScrapingProcessor } from "./processing/processors/jina-web-scraping.processor.js";
import {
  WikidataProcessor,
  WikipediaProcessor,
} from "./processing/processors/wikimedia.processor.js";

// Type for full enriched POI data
type EnrichedPoiData = Static<typeof jsonSchemas.PoiEnrichedSchema>;

interface PoiBasicInfo {
  name: string;
  latitude: number;
  longitude: number;
  cityName?: string | null;
}

interface OsmTags {
  wikidata?: string;
  wikipedia?: string;
  [key: string]: unknown;
}

interface ProcessingResults {
  googleMapsResult: ProcessResult<GoogleMapsScrapeResponse> | undefined;
  jinaResult: ProcessResult<JinaScrapeResponse> | undefined;
  wikidataResult?: ProcessResult<WikimediaResponse> | undefined;
  wikipediaResult?: ProcessResult<WikimediaResponse> | undefined;
}

interface EnrichmentResult {
  name: string;
  description: string | null;
  funFacts: Array<{ content: string; order: number }>;
  source: "llm" | "scraper-maps";
}

/**
 * Service for enriching POI data from multiple sources
 */
export class PoiEnrichmentService {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Build Jina query: add city name only if not already in POI name
   */
  buildJinaQuery(poi: PoiBasicInfo): string {
    let jinaQuery = poi.name;
    if (
      poi.cityName !== null &&
      poi.cityName !== undefined &&
      poi.cityName.trim() !== ""
    ) {
      const poiNameNormalized = normalizeSearchText(poi.name);
      const cityNameNormalized = normalizeSearchText(poi.cityName);
      // Check if city name is not already in POI name (ignoring accents, spaces, special chars)
      if (!poiNameNormalized.includes(cityNameNormalized)) {
        jinaQuery = `${poi.name} ${poi.cityName}`;
      }
    }
    return jinaQuery;
  }

  /**
   * Extract Wikidata and Wikipedia IDs from OSM tags
   */
  extractWikimediaIds(osmTags: OsmTags | null): {
    wikidataId?: string | undefined;
    wikipediaTitle?: string | undefined;
  } {
    const wikidataId =
      osmTags !== null &&
      typeof osmTags === "object" &&
      "wikidata" in osmTags &&
      typeof osmTags.wikidata === "string"
        ? osmTags.wikidata
        : undefined;

    const wikipediaTitle =
      osmTags !== null &&
      typeof osmTags === "object" &&
      "wikipedia" in osmTags &&
      typeof osmTags.wikipedia === "string"
        ? osmTags.wikipedia
        : undefined;

    return {
      ...(wikidataId !== undefined && { wikidataId }),
      ...(wikipediaTitle !== undefined && { wikipediaTitle }),
    };
  }

  /**
   * Process all data sources in parallel (Google Maps, Jina, Wikidata, Wikipedia)
   */
  async processDataSources(
    poiId: string,
    poi: PoiBasicInfo,
    jinaQuery: string,
    wikidataId?: string,
    wikipediaTitle?: string,
  ): Promise<ProcessingResults> {
    const batchId = randomUUID();
    const orchestrator = new ProcessingResultOrchestrator(this.fastify);
    const geoCoordinates = `${poi.latitude},${poi.longitude}`;

    // Execute all 4 tasks as a typed tuple
    const results = await Promise.allSettled([
      orchestrator.process(new GoogleMapsScrapingProcessor(), {
        targetId: poiId,
        params: {
          query: poi.name,
          geoCoordinates,
          zoom: 15,
          langCode: "fr",
        },
        batchId,
      }),
      orchestrator.process(new JinaWebScrapingProcessor(), {
        targetId: poiId,
        params: {
          query: jinaQuery,
          gl: "FR",
          hl: "fr",
          num: 5,
        },
        batchId,
      }),
      // Wikidata: execute if tag is present, otherwise use dummy result
      wikidataId !== undefined && wikidataId !== ""
        ? orchestrator.process(new WikidataProcessor(), {
            targetId: poiId,
            params: { wikidataId },
            batchId,
          })
        : undefined,
      // Wikipedia: execute if tag is present, otherwise use dummy result
      wikipediaTitle !== undefined && wikipediaTitle !== ""
        ? orchestrator.process(new WikipediaProcessor(), {
            targetId: poiId,
            params: { wikipediaTitle },
            batchId,
          })
        : undefined,
    ]);

    // Build result object, only including optional properties if they are defined
    const result: ProcessingResults = {
      googleMapsResult:
        results[0].status === "fulfilled" ? results[0].value : undefined,
      jinaResult:
        results[1].status === "fulfilled" ? results[1].value : undefined,
      wikidataResult:
        results[2].status === "fulfilled" ? results[2].value : undefined,
      wikipediaResult:
        results[3].status === "fulfilled" ? results[3].value : undefined,
    };

    return result;
  }

  /**
   * Extract and validate Google Maps place from processing results
   */
  getGoogleMapsPlaceIfNear(
    results: ProcessingResults,
    poiLatitude: number,
    poiLongitude: number,
  ): GoogleMapsPlaceStrict | null {
    const scrapeResponse = results.googleMapsResult?.scrapeResponse;

    if (scrapeResponse?.place === null || scrapeResponse?.place === undefined) {
      return null;
    }

    const distance = getDistance(
      { latitude: poiLatitude, longitude: poiLongitude },
      {
        latitude: scrapeResponse.place.latitude,
        longitude: scrapeResponse.place.longitude,
      },
    );

    // Distance is in meters, 1km = 1000m
    if (distance > 1000) {
      this.fastify.log.info(
        {
          distance,
          placeTitle: scrapeResponse.place.title,
        },
        "Google Maps place filtered out (beyond 1km)",
      );
      return null;
    }

    return scrapeResponse.place;
  }

  /**
   * Process Gemini LLM enrichment
   */
  async processGeminiEnrichment(
    poiId: string,
    poi: PoiBasicInfo,
    rawData: {
      googleMapsRawData: GoogleMapsPlaceStrict | null;
      jinaRawData: Record<string, unknown>;
      wikidataRawData: Record<string, unknown>;
      wikipediaRawData: Record<string, unknown>;
    },
    osmTags: OsmTags | null,
  ): Promise<EnrichedPoiData> {
    const orchestrator = new ProcessingResultOrchestrator(this.fastify);
    const batchId = randomUUID();
    const geminiProcessor = new GeminiLlmProcessor();

    const geminiResult = await orchestrator.process(geminiProcessor, {
      targetId: poiId,
      params: {
        googleMapsData: rawData.googleMapsRawData ?? {},
        jinaData: rawData.jinaRawData,
        wikidataData: rawData.wikidataRawData,
        wikipediaData: rawData.wikipediaRawData,
        poiName: poi.name,
        latitude: poi.latitude,
        longitude: poi.longitude,
        osmTags,
      },
      batchId,
    });

    if (!geminiResult.success || geminiResult.scrapeResponse === undefined) {
      const errorMessage = geminiResult.error ?? "Unknown error";

      const errorDetails = {
        message: errorMessage,
        success: geminiResult.success,
        hasData: geminiResult.scrapeResponse !== undefined,
      };

      this.fastify.log.error(
        { poiId, geminiResult, errorDetails },
        "Gemini LLM enrichment failed",
      );

      throw new Error(`Gemini LLM enrichment failed: ${errorMessage}`);
    }

    // geminiResult.scrapeResponse is GeminiGenerateEnrichedPoiResponse
    // We need to access its data property to get the enriched data
    const geminiResponse = geminiResult.scrapeResponse;

    if (
      !geminiResponse.success ||
      geminiResponse.data === undefined ||
      (geminiResponse.error !== undefined && geminiResponse.error !== "")
    ) {
      const errorMessage = geminiResponse.error ?? "Unknown error";

      this.fastify.log.error(
        {
          poiId,
          geminiResult,
          geminiResponse,
          errorMessage,
        },
        "Gemini LLM enrichment failed - response indicates failure",
      );

      throw new Error(`Gemini LLM enrichment failed: ${errorMessage}`);
    }

    return geminiResponse.data;
  }

  /**
   * Create enrichment result from enriched data
   */
  mapEnrichedDataToResult(enrichedData: EnrichedPoiData): EnrichmentResult {
    const funFacts = mapFunFactsToDbFormat(enrichedData.funFacts);

    return {
      name: enrichedData.name,
      description: enrichedData.description ?? null,
      funFacts,
      source: "llm",
    };
  }

  /**
   * Log processing results for monitoring
   */
  logProcessingResults(poiId: string, results: ProcessingResults): void {
    if (results.jinaResult !== undefined && !results.jinaResult.success) {
      this.fastify.log.warn(
        { webScrapeResult: results.jinaResult, poiId },
        "Web scraping with Jina AI failed, continuing without Jina data",
      );
    }

    if (
      results.googleMapsResult !== undefined &&
      !results.googleMapsResult.success
    ) {
      this.fastify.log.warn(
        { processResult: results.googleMapsResult, poiId },
        "Google Maps scraping failed, continuing without Google Maps data",
      );
    }

    if (
      results.wikidataResult !== undefined &&
      !results.wikidataResult.success
    ) {
      this.fastify.log.warn(
        { wikidataResult: results.wikidataResult, poiId },
        "Wikidata fetch failed, continuing without Wikidata data",
      );
    }

    if (
      results.wikipediaResult !== undefined &&
      !results.wikipediaResult.success
    ) {
      this.fastify.log.warn(
        { wikipediaResult: results.wikipediaResult, poiId },
        "Wikipedia fetch failed, continuing without Wikipedia data",
      );
    }
  }
}
