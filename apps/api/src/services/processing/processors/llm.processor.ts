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

/**
 * Processor for LLM enrichment using AI models (Gemini or Groq)
 */
export class LlmProcessor implements ScrapingProcessor<
  LLMGenerateEnrichedPoiParams,
  LLMGenerateEnrichedPoiResponse
> {
  async execute(
    fastify: FastifyInstance,
    params: LLMGenerateEnrichedPoiParams,
  ): Promise<LLMGenerateEnrichedPoiResponse> {
    return await generateEnrichedPoi(fastify, params);
  }

  getType(): "llm" {
    return "llm";
  }

  transformInput(
    params: LLMGenerateEnrichedPoiParams,
  ): Record<string, unknown> {
    // Store the complete input including prompt context and raw data
    return {
      poiName: params.poiName,
      latitude: params.latitude,
      longitude: params.longitude,
      googleMapsData: params.googleMapsData,
      wikipediaData: params.wikipediaData,
      wikidataData: params.wikidataData,
      webData: params.webData,
      osmTags: params.osmTags,
    };
  }

  transformOutput(
    response: LLMGenerateEnrichedPoiResponse,
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
      ...(response.usage !== undefined && { usage: response.usage }),
    };
  }

  getMetadata(
    _params: LLMGenerateEnrichedPoiParams,
    response: LLMGenerateEnrichedPoiResponse,
  ): ProcessingMetadata | undefined {
    if (!isScrapingSuccess(response)) {
      return undefined;
    }

    const metadata: ProcessingMetadata = {};

    metadata.isValid = response.isValid;

    if (response.usage?.totalTokens !== undefined) {
      metadata.cost = response.usage.totalTokens;
    }

    if (response.usage !== undefined) {
      metadata.metadata = {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      };
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }
}
