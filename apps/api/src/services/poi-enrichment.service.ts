import { type PoiEnriched } from "@vagabond/shared-utils";
import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";

import { captureAndLog, getLogger } from "../utils/logger.js";
import { normalizeSearchText } from "../utils/text.js";
import type { JinaEnrichedResult } from "./jina-enrichment.service.js";
import { JinaEnrichmentService } from "./jina-enrichment.service.js";
import {
  isProcessSuccess,
  ProcessingResultOrchestrator,
} from "./processing/processing-result-orchestrator.js";
import { LlmProcessor } from "./processing/processors/llm.processor.js";
import { isScrapingSuccess } from "./processing/scraping-processor.interface.js";
import type { TruncatedSourceItem } from "./utils/content-truncation.js";

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
  batchId: string;
  jinaEnriched: JinaEnrichedResult;
}

/**
 * Service for enriching POI data from multiple sources
 */
export class PoiEnrichmentService {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Build Jina Search query: add city name only if not already in POI name
   */
  buildJinaSearchQuery(poi: PoiBasicInfo): string {
    let jinaSearchQuery = poi.name;
    if (
      poi.cityName !== null &&
      poi.cityName !== undefined &&
      poi.cityName.trim() !== ""
    ) {
      const poiNameNormalized = normalizeSearchText(poi.name);
      const cityNameNormalized = normalizeSearchText(poi.cityName);
      if (!poiNameNormalized.includes(cityNameNormalized)) {
        jinaSearchQuery = `${poi.name} ${poi.cityName}`;
      }
    }
    return jinaSearchQuery;
  }

  /**
   * Process all data sources in parallel (Jina Search+Reader)
   */
  async processDataSources(
    poiId: string,
    jinaSearchQuery: string,
    osmTags: OsmTags | null,
  ): Promise<ProcessingResults> {
    const batchId = randomUUID();
    const jinaService = new JinaEnrichmentService(this.fastify);

    const [jinaSettled] = await Promise.allSettled([
      jinaService.enrich(
        poiId,
        { query: jinaSearchQuery, gl: "FR", num: 10 },
        osmTags !== null
          ? {
              ...(typeof osmTags.wikidata === "string" && {
                wikidata: osmTags.wikidata,
              }),
              ...(typeof osmTags.wikipedia === "string" && {
                wikipedia: osmTags.wikipedia,
              }),
            }
          : null,
        batchId,
      ),
    ]);

    if (jinaSettled.status === "rejected") {
      captureAndLog(
        this.fastify,
        jinaSettled.reason instanceof Error
          ? jinaSettled.reason
          : new Error(String(jinaSettled.reason)),
        "Jina enrichment failed (Promise rejected), using empty fallback",
        {
          level: "warning",
          tags: { operation: "jina-enrichment" },
          extra: { poiId },
        },
      );
    }

    return {
      batchId,
      jinaEnriched:
        jinaSettled.status === "fulfilled"
          ? jinaSettled.value
          : {
              webContent: [],
              wikipediaContent: [],
              wikidataContent: [],
            },
    };
  }

  /**
   * Process LLM enrichment (Gemini or Groq)
   */
  async processGeminiEnrichment(
    poiId: string,
    poi: PoiBasicInfo,
    rawData: {
      wikipediaRawData: TruncatedSourceItem[];
      wikidataRawData: TruncatedSourceItem[];
      webRawData: TruncatedSourceItem[];
    },
    osmTags: OsmTags | null,
    batchId: string,
  ): Promise<PoiEnriched> {
    const orchestrator = new ProcessingResultOrchestrator(this.fastify);
    const llmProcessor = new LlmProcessor();

    const llmResult = await orchestrator.process(llmProcessor, {
      targetId: poiId,
      params: {
        googleMapsData: {},
        wikipediaData: rawData.wikipediaRawData,
        wikidataData: rawData.wikidataRawData,
        webData: rawData.webRawData,
        poiName: poi.name,
        latitude: poi.latitude,
        longitude: poi.longitude,
        osmTags,
      },
      batchId,
    });

    if (!isProcessSuccess(llmResult)) {
      const errorMessage = llmResult.error;

      getLogger(this.fastify).error(
        {
          poiId,
          llmResult,
          errorInstance: llmResult.errorInstance,
        },
        "LLM enrichment failed",
      );

      throw new Error(`LLM enrichment failed: ${errorMessage}`);
    }

    const llmResponse = llmResult.scrapeResponse;

    if (!isScrapingSuccess(llmResponse)) {
      const errorMessage = llmResponse.error;

      getLogger(this.fastify).error(
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

    if (llmResponse.data === undefined) {
      const errorMessage = "LLM response missing data";

      getLogger(this.fastify).error(
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

    return llmResponse.data as PoiEnriched;
  }

  /**
   * Log processing results for monitoring
   */
  logProcessingResults(poiId: string, results: ProcessingResults): void {
    const { jinaEnriched } = results;
    const hasAnyJinaContent =
      jinaEnriched.webContent.length > 0 ||
      jinaEnriched.wikipediaContent.length > 0 ||
      jinaEnriched.wikidataContent.length > 0;

    if (!hasAnyJinaContent) {
      getLogger(this.fastify).warn(
        {
          poiId,
          ...(jinaEnriched.diagnostic !== undefined && {
            searchUrlCount: jinaEnriched.diagnostic.searchUrlCount,
            tagUrlCount: jinaEnriched.diagnostic.tagUrlCount,
            filteredCount: jinaEnriched.diagnostic.filteredCount,
            readerSuccessCount: jinaEnriched.diagnostic.readerSuccessCount,
            readerWithContentCount:
              jinaEnriched.diagnostic.readerWithContentCount,
          }),
        },
        "Jina enrichment returned no content for any source",
      );
    }
  }
}
