import { type jsonSchemas } from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";
import { type Static } from "typebox";

import {
  type GeminiGenerateEnrichedPoiParams,
  generateEnrichedPoi,
} from "../../http/gemini-client.js";
import type {
  ProcessingMetadata,
  ScrapingProcessor,
} from "../scraping-processor.interface.js";

export interface GeminiLlmParams {
  googleMapsData: Record<string, unknown>;
  jinaData: Record<string, unknown>;
  wikidataData: Record<string, unknown>;
  wikipediaData: Record<string, unknown>;
  poiName: string;
  latitude: number;
  longitude: number;
  osmTags: Record<string, unknown> | null;
}

export interface GeminiGenerateEnrichedPoiResponse {
  success: boolean;
  error?: string;
  isValid?: boolean;
  data: Static<typeof jsonSchemas.PoiEnrichedSchema> | undefined;
}

/**
 * Processor for LLM enrichment using Gemini AI
 */
export class GeminiLlmProcessor implements ScrapingProcessor<
  GeminiLlmParams,
  GeminiGenerateEnrichedPoiResponse
> {
  execute(
    fastify: FastifyInstance,
    params: GeminiLlmParams,
  ): Promise<GeminiGenerateEnrichedPoiResponse> {
    const geminiParams: GeminiGenerateEnrichedPoiParams = {
      googleMapsData: params.googleMapsData,
      jinaData: params.jinaData,
      wikidataData: params.wikidataData,
      wikipediaData: params.wikipediaData,
      poiName: params.poiName,
      latitude: params.latitude,
      longitude: params.longitude,
      osmTags: params.osmTags,
    };

    return generateEnrichedPoi(fastify, geminiParams);
  }

  getType(): "llm" {
    return "llm";
  }

  transformInput(params: GeminiLlmParams): Record<string, unknown> {
    // Store the complete input including prompt context and raw data
    return {
      poiName: params.poiName,
      latitude: params.latitude,
      longitude: params.longitude,
      googleMapsData: params.googleMapsData,
      jinaData: params.jinaData,
      wikidataData: params.wikidataData,
      wikipediaData: params.wikipediaData,
      osmTags: params.osmTags,
    };
  }

  transformOutput(
    response: GeminiGenerateEnrichedPoiResponse,
  ): Record<string, unknown> {
    // Store the complete response JSON
    return {
      data: response.data,
      ...(response.error !== undefined && { error: response.error }),
      ...(response.isValid !== undefined && { isValid: response.isValid }),
    };
  }

  getMetadata(
    _params: GeminiLlmParams,
    response: GeminiGenerateEnrichedPoiResponse,
  ): ProcessingMetadata | undefined {
    if (response.isValid === undefined) {
      return undefined;
    }

    return {
      isValid: response.isValid,
    };
  }
}
