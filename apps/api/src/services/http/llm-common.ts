import type { FastifyInstance } from "fastify";

import { getLogger } from "../../utils/logger.js";
import type {
  ScrapingErrorResponse,
  ScrapingResponse,
  ScrapingSuccessResponse,
} from "../processing/scraping-processor.interface.js";

/**
 * Structured item for web/Wikipedia/Wikidata sources (url, title, content)
 */
export interface WebSourceItem {
  url: string;
  content: string;
  title?: string;
  images?: Array<{ alt: string; url: string }>;
}

/**
 * Common interface for LLM generate enriched POI parameters
 */
export interface LLMGenerateEnrichedPoiParams {
  googleMapsData: Record<string, unknown>;
  /** Wikipedia pages (before web data, order: Wikipedia first) */
  wikipediaData: WebSourceItem[];
  /** Wikidata pages (before web data) */
  wikidataData: WebSourceItem[];
  /** Web pages (hors wikipedia/wikidata), ordre de scraping */
  webData: WebSourceItem[];
  poiName: string;
  latitude: number;
  longitude: number;
  osmTags: Record<string, unknown> | null;
}

/**
 * Success data for LLM generate enriched POI response
 */
export interface LLMGenerateEnrichedPoiSuccessData {
  isValid: boolean;
  data: unknown;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Common interface for LLM generate enriched POI response
 */
export type LLMGenerateEnrichedPoiResponse =
  ScrapingResponse<LLMGenerateEnrichedPoiSuccessData>;

/**
 * Common generation options for LLM models
 */
export interface LLMGenerationOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
}

/**
 * Default generation options
 */
export const DEFAULT_LLM_OPTIONS: Required<LLMGenerationOptions> = {
  temperature: 0.5,
  topP: 0.9,
  topK: 50,
};

/**
 * Validate and return error response
 */
export function createErrorResponse(
  fastify: FastifyInstance,
  error: unknown,
  params: LLMGenerateEnrichedPoiParams,
  providerName: string,
): LLMGenerateEnrichedPoiResponse {
  getLogger(fastify).error(
    { error, params },
    `${providerName} API request failed`,

    { error, params },
    `${providerName} API request failed`,
  );

  const errorResponse: ScrapingErrorResponse = {
    success: false,
    error:
      error instanceof Error
        ? error.message
        : `HTTP request failed: ${String(error)}`,
    ...(error instanceof Error && { errorInstance: error }),
  };

  return errorResponse;
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  fastify: FastifyInstance,
  data: unknown,
  providerName: string,
): LLMGenerateEnrichedPoiResponse {
  getLogger(fastify).warn(
    { data },
    `${providerName} JSON schema response validation failed`,
  );

  const errorResponse: ScrapingErrorResponse = {
    success: false,
    error: `${providerName} JSON schema response validation failed`,
    rawResult: data,
  };

  return errorResponse;
}

/**
 * Create success response
 */
export function createSuccessResponse(
  data: unknown,
  isValid: boolean,
  usage?: {
    promptTokens?: number | undefined;
    completionTokens?: number | undefined;
    totalTokens?: number | undefined;
  },
): LLMGenerateEnrichedPoiResponse {
  const successData: LLMGenerateEnrichedPoiSuccessData = {
    isValid,
    data,
  };

  if (usage !== undefined) {
    successData.usage = {
      ...(usage.promptTokens !== undefined && {
        promptTokens: usage.promptTokens,
      }),
      ...(usage.completionTokens !== undefined && {
        completionTokens: usage.completionTokens,
      }),
      ...(usage.totalTokens !== undefined && {
        totalTokens: usage.totalTokens,
      }),
    };
  }

  const successResponse: ScrapingSuccessResponse<LLMGenerateEnrichedPoiSuccessData> =
    {
      success: true,
      ...successData,
    };

  return successResponse;
}
