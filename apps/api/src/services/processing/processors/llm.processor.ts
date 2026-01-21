import type { FastifyInstance } from "fastify";

import { generateEnrichedPoi } from "../../http/llm-client.js";
import {
  type LLMGenerateEnrichedPoiParams,
  type LLMGenerateEnrichedPoiResponse,
} from "../../http/llm-common.js";
import type {
  ProcessingMetadata,
  ScrapingProcessor,
} from "../scraping-processor.interface.js";
import { isScrapingSuccess } from "../scraping-processor.interface.js";

export interface LlmParams {
  googleMapsData: Record<string, unknown>;
  jinaData: Record<string, unknown>;
  wikidataData: Record<string, unknown>;
  wikipediaData: Record<string, unknown>;
  poiName: string;
  latitude: number;
  longitude: number;
  osmTags: Record<string, unknown> | null;
}

export type LlmGenerateEnrichedPoiResponse = LLMGenerateEnrichedPoiResponse;

/**
 * Processor for LLM enrichment using AI models (Gemini or Groq)
 */
export class LlmProcessor implements ScrapingProcessor<
  LlmParams,
  LlmGenerateEnrichedPoiResponse
> {
  async execute(
    fastify: FastifyInstance,
    params: LlmParams,
  ): Promise<LlmGenerateEnrichedPoiResponse> {
    const llmParams: LLMGenerateEnrichedPoiParams = {
      googleMapsData: params.googleMapsData,
      jinaData: params.jinaData,
      wikidataData: params.wikidataData,
      wikipediaData: params.wikipediaData,
      poiName: params.poiName,
      latitude: params.latitude,
      longitude: params.longitude,
      osmTags: params.osmTags,
    };

    const response = await generateEnrichedPoi(fastify, llmParams);
    return response as LlmGenerateEnrichedPoiResponse;
  }

  getType(): "llm" {
    return "llm";
  }

  transformInput(params: LlmParams): Record<string, unknown> {
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
    response: LlmGenerateEnrichedPoiResponse,
  ): Record<string, unknown> {
    // Store the complete response JSON
    if (!isScrapingSuccess(response)) {
      return {
        error: response.error,
      };
    }

    return {
      data: response.data,
      isValid: response.isValid,
      ...(response.usage && { usage: response.usage }),
    };
  }

  getMetadata(
    _params: LlmParams,
    response: LlmGenerateEnrichedPoiResponse,
  ): ProcessingMetadata | undefined {
    if (!isScrapingSuccess(response)) {
      return undefined;
    }

    const metadata: ProcessingMetadata = {};

    metadata.isValid = response.isValid;

    if (response.usage?.totalTokens !== undefined) {
      metadata.cost = response.usage.totalTokens;
    }

    if (response.usage) {
      metadata.metadata = {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      };
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }
}

// Re-export old names for backwards compatibility
export type GeminiLlmParams = LlmParams;
export type GeminiGenerateEnrichedPoiResponse = LlmGenerateEnrichedPoiResponse;
export const GeminiLlmProcessor = LlmProcessor;
