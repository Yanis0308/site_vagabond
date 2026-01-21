import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProviderOptions,
} from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";
import { generateText, jsonSchema, Output } from "ai";
import type { FastifyInstance } from "fastify";

import { buildGeminiPrompt } from "./llm-prompt.js";
import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
  DEFAULT_LLM_OPTIONS,
  type LLMGenerateEnrichedPoiParams,
  type LLMGenerateEnrichedPoiResponse,
  type LLMGenerationOptions,
} from "./llm-common.js";

/**
 * Generate enriched POI data using Gemini AI
 */
export async function generateEnrichedPoiWithGemini(
  fastify: FastifyInstance,
  params: LLMGenerateEnrichedPoiParams,
  options: LLMGenerationOptions = {},
): Promise<LLMGenerateEnrichedPoiResponse> {
  const {
    gemini: { apiKey: geminiApiKey },
  } = fastify.config;

  const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });

  try {
    // Build the prompt
    const prompt = buildGeminiPrompt({
      googleMapsData: params.googleMapsData,
      jinaData: params.jinaData,
      wikidataData: params.wikidataData,
      wikipediaData: params.wikipediaData,
      poiName: params.poiName,
      latitude: params.latitude,
      longitude: params.longitude,
      osmTags: params.osmTags,
    });

    // Use jsonSchema helper from AI SDK to wrap the JSON schema
    const schema = jsonSchema(jsonSchemas.PoiEnrichedSchema);

    const { text, usage } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt,
      temperature: options.temperature ?? DEFAULT_LLM_OPTIONS.temperature,
      topP: options.topP ?? DEFAULT_LLM_OPTIONS.topP,
      topK: options.topK ?? DEFAULT_LLM_OPTIONS.topK,
      output: Output.object({
        schema,
      }),
      providerOptions: {
        google: {} satisfies GoogleGenerativeAIProviderOptions,
      },
    });

    fastify.log.info({ text, usage }, "Gemini response");

    // Parse and validate the response
    const parsedData: unknown = JSON.parse(text);

    // Validate the parsed data against the TypeBox schema
    const validateData = generateValidator(jsonSchemas.PoiEnrichedSchema);
    const isValid = validateData(parsedData);

    if (!isValid) {
      return createValidationErrorResponse(fastify, parsedData, "Gemini");
    }

    const usageData: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    } = {};

    if (usage?.inputTokens !== undefined) {
      usageData.promptTokens = usage.inputTokens;
    }
    if (usage?.outputTokens !== undefined) {
      usageData.completionTokens = usage.outputTokens;
    }
    if (usage?.inputTokens !== undefined && usage?.outputTokens !== undefined) {
      usageData.totalTokens = usage.inputTokens + usage.outputTokens;
    }

    return createSuccessResponse(parsedData, isValid, usageData);
  } catch (error) {
    return createErrorResponse(fastify, error, params, "Gemini");
  }
}

/**
 * Generate enriched POI data using Groq AI
 */
export async function generateEnrichedPoiWithGroq(
  fastify: FastifyInstance,
  params: LLMGenerateEnrichedPoiParams,
  options: LLMGenerationOptions = {},
): Promise<LLMGenerateEnrichedPoiResponse> {
  const {
    groq: { apiKey: groqApiKey },
  } = fastify.config;

  const groq = createGroq({ apiKey: groqApiKey });

  try {
    // Build the prompt
    const prompt = buildGeminiPrompt({
      googleMapsData: params.googleMapsData,
      jinaData: params.jinaData,
      wikidataData: params.wikidataData,
      wikipediaData: params.wikipediaData,
      poiName: params.poiName,
      latitude: params.latitude,
      longitude: params.longitude,
      osmTags: params.osmTags,
    });

    // Use jsonSchema helper from AI SDK to wrap the JSON schema
    const schema = jsonSchema(jsonSchemas.PoiEnrichedSchema);

    const { text, usage } = await generateText({
      model: groq("openai/gpt-oss-20b"),
      prompt,
      temperature: options.temperature ?? DEFAULT_LLM_OPTIONS.temperature,
      topP: options.topP ?? DEFAULT_LLM_OPTIONS.topP,
      topK: options.topK ?? DEFAULT_LLM_OPTIONS.topK,
      output: Output.object({
        schema,
      }),
    });

    fastify.log.info({ text, usage }, "Groq response");

    // Parse and validate the response
    const parsedData: unknown = JSON.parse(text);

    // Validate the parsed data against the TypeBox schema
    const validateData = generateValidator(jsonSchemas.PoiEnrichedSchema);
    const isValid = validateData(parsedData);

    if (!isValid) {
      return createValidationErrorResponse(fastify, parsedData, "Groq");
    }

    const usageData: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    } = {};

    if (usage.inputTokens !== undefined) {
      usageData.promptTokens = usage.inputTokens;
    }
    if (usage.outputTokens !== undefined) {
      usageData.completionTokens = usage.outputTokens;
    }
    if (usage.inputTokens !== undefined && usage.outputTokens !== undefined) {
      usageData.totalTokens = usage.inputTokens + usage.outputTokens;
    }

    return createSuccessResponse(parsedData, isValid, usageData);
  } catch (error) {
    return createErrorResponse(fastify, error, params, "Groq");
  }
}

export async function generateEnrichedPoi(
  fastify: FastifyInstance,
  params: LLMGenerateEnrichedPoiParams,
  options: LLMGenerationOptions = {},
): Promise<LLMGenerateEnrichedPoiResponse> {
  // Default to Groq for backwards compatibility with current implementation
  // return await generateEnrichedPoiWithGroq(fastify, params, options);
  return await generateEnrichedPoiWithGemini(fastify, params, options);
}
