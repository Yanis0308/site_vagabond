import { type jsonSchemas } from "@vagabond/shared-utils";
import { type GoogleMapsPlaceStrict } from "@vagabond/shared-utils";
import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";
import { getDistance } from "geolib";
import type { Static } from "typebox";

import { normalizeSearchText } from "../utils/text.js";
import type { GoogleMapsScrapeResponse } from "./http/data-scraper-client.js";
import type { JinaScrapeResponse } from "./http/jina-client.js";
import type { WikimediaResponse } from "./http/wikimedia-client.js";
import type { ProcessResult } from "./processing/processing-result-orchestrator.js";
import {
  isProcessSuccess,
  ProcessingResultOrchestrator,
} from "./processing/processing-result-orchestrator.js";
import { GoogleMapsScrapingProcessor } from "./processing/processors/google-maps-scraping.processor.js";
import { JinaWebScrapingProcessor } from "./processing/processors/jina-web-scraping.processor.js";
import { LlmProcessor } from "./processing/processors/llm.processor.js";
import { isScrapingSuccess } from "./processing/scraping-processor.interface.js";
// Temporarily disabled: WikidataProcessor, WikipediaProcessor
// import {
//   WikidataProcessor,
//   WikipediaProcessor,
// } from "./processing/processors/wikimedia.processor.js";

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
    // wikidataId?: string,
    // wikipediaTitle?: string,
  ): Promise<ProcessingResults> {
    const batchId = randomUUID();
    const orchestrator = new ProcessingResultOrchestrator(this.fastify);
    const geoCoordinates = `${poi.latitude},${poi.longitude}`;

    // Execute all 4 tasks as a typed tuple
    // Temporarily disabled: WikidataProcessor and WikipediaProcessor
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
          // hl: "fr",
          num: 5,
        },
        batchId,
      }),
      // Temporarily disabled: Wikidata processor
      // wikidataId !== undefined && wikidataId !== ""
      //   ? orchestrator.process(new WikidataProcessor(), {
      //       targetId: poiId,
      //       params: { wikidataId },
      //       batchId,
      //     })
      //   : undefined,
      Promise.resolve(undefined),
      // Temporarily disabled: Wikipedia processor
      // wikipediaTitle !== undefined && wikipediaTitle !== ""
      //   ? orchestrator.process(new WikipediaProcessor(), {
      //       targetId: poiId,
      //       params: { wikipediaTitle },
      //       batchId,
      //     })
      //   : undefined,
      Promise.resolve(undefined),
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
    const googleMapsResult = results.googleMapsResult;
    if (googleMapsResult === undefined) {
      return null;
    }

    if (!isProcessSuccess(googleMapsResult)) {
      return null;
    }

    const scrapeResponse = googleMapsResult.scrapeResponse;
    if (!isScrapingSuccess(scrapeResponse)) {
      return null;
    }

    const place = scrapeResponse.place;
    if (place === null) {
      return null;
    }

    const distance = getDistance(
      { latitude: poiLatitude, longitude: poiLongitude },
      {
        latitude: place.latitude,
        longitude: place.longitude,
      },
    );

    // Distance is in meters, 1km = 1000m
    if (distance > 1000) {
      this.fastify.log.info(
        {
          distance,
          placeTitle: place.title,
        },
        "Google Maps place filtered out (beyond 1km)",
      );
      return null;
    }

    return place;
  }

  /**
   * Process LLM enrichment (Gemini or Groq)
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
    const llmProcessor = new LlmProcessor();

    const llmResult = await orchestrator.process(llmProcessor, {
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

    // Check if orchestrator failed (exception, failed to create processing result, or processor returned success=false)
    if (!isProcessSuccess(llmResult)) {
      const errorMessage = llmResult.error;

      this.fastify.log.error(
        {
          poiId,
          llmResult,
          errorInstance: llmResult.errorInstance,
        },
        "LLM enrichment failed",
      );

      throw new Error(`LLM enrichment failed: ${errorMessage}`);
    }

    // If we reach here, orchestrator succeeded and processor response indicates success
    const llmResponse = llmResult.scrapeResponse;

    // Validate that we have the expected data
    if (!isScrapingSuccess(llmResponse)) {
      const errorMessage = llmResponse.error;

      this.fastify.log.error(
        {
          poiId,
          llmResult,
          llmResponse,
          errorInstance: llmResponse.errorInstance,
          errorMessage,
        },
        "LLM enrichment failed - response indicates failure",
      );

      throw new Error(`LLM enrichment failed: ${errorMessage}`);
    }

    // llmResponse is ScrapingSuccessResponse<LLMGenerateEnrichedPoiSuccessData> here
    // data is required in LLMGenerateEnrichedPoiSuccessData, so it should always be defined
    // But we check anyway for safety
    if (llmResponse.data === undefined) {
      const errorMessage = "LLM response missing data";

      this.fastify.log.error(
        {
          poiId,
          llmResult,
          llmResponse,
          errorMessage,
        },
        "LLM enrichment failed - response missing data",
      );

      throw new Error(`LLM enrichment failed: ${errorMessage}`);
    }

    return llmResponse.data as EnrichedPoiData;
  }

  /**
   * Log processing results for monitoring
   */
  logProcessingResults(poiId: string, results: ProcessingResults): void {
    if (results.jinaResult !== undefined) {
      if (!isProcessSuccess(results.jinaResult)) {
        this.fastify.log.warn(
          {
            webScrapeResult: results.jinaResult,
            errorInstance: results.jinaResult.errorInstance,
            poiId,
          },
          "Web scraping with Jina AI failed, continuing without Jina data",
        );
      }
    }

    if (results.googleMapsResult !== undefined) {
      if (!isProcessSuccess(results.googleMapsResult)) {
        this.fastify.log.warn(
          {
            processResult: results.googleMapsResult,
            errorInstance: results.googleMapsResult.errorInstance,
            poiId,
          },
          "Google Maps scraping failed, continuing without Google Maps data",
        );
      }
    }

    if (results.wikidataResult !== undefined) {
      if (!isProcessSuccess(results.wikidataResult)) {
        this.fastify.log.warn(
          {
            wikidataResult: results.wikidataResult,
            errorInstance: results.wikidataResult.errorInstance,
            poiId,
          },
          "Wikidata fetch failed, continuing without Wikidata data",
        );
      }
    }

    if (results.wikipediaResult !== undefined) {
      if (!isProcessSuccess(results.wikipediaResult)) {
        this.fastify.log.warn(
          {
            wikipediaResult: results.wikipediaResult,
            errorInstance: results.wikipediaResult.errorInstance,
            poiId,
          },
          "Wikipedia fetch failed, continuing without Wikipedia data",
        );
      }
    }
  }
}
