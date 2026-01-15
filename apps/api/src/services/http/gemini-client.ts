import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProviderOptions,
} from "@ai-sdk/google";
import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";
import { generateText, jsonSchema, Output } from "ai";
import type { FastifyInstance } from "fastify";

import { type GeminiGenerateEnrichedPoiResponse } from "../processing/processors/gemini-llm.processor.js";
import { buildGeminiPrompt } from "./gemini-prompt.js";

export interface GeminiGenerateEnrichedPoiParams {
  googleMapsData: Record<string, unknown>;
  jinaData: Record<string, unknown>;
  wikidataData: Record<string, unknown>;
  wikipediaData: Record<string, unknown>;
  poiName: string;
  latitude: number;
  longitude: number;
  osmTags: Record<string, unknown> | null;
}

/**
 * Generate enriched POI data using Gemini AI
 */
export async function generateEnrichedPoi(
  fastify: FastifyInstance,
  params: GeminiGenerateEnrichedPoiParams,
): Promise<GeminiGenerateEnrichedPoiResponse> {
  const { apiKey } = fastify.config.gemini;

  const google = createGoogleGenerativeAI({ apiKey });

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

    // console.log(JSON.stringify(jsonSchemas.PoiEnrichedSchema, null, 2));

    // Use jsonSchema helper from AI SDK to wrap the JSON schema
    // Cast to any to handle allOf structure which is valid JSON Schema but TypeScript types are strict
    const schema = jsonSchema(jsonSchemas.PoiEnrichedSchema);

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
      temperature: 0.5,
      topP: 0.9,
      topK: 50,
      output: Output.object({
        schema,
      }),
      providerOptions: {
        google: {} satisfies GoogleGenerativeAIProviderOptions,
      },
    });

    fastify.log.info({ text }, "Gemini response");

    // Use the object directly (already parsed and validated by AI SDK)
    // Cast to the expected TypeBox schema type
    const parsedData: unknown = JSON.parse(text);

    // Validate the parsed data against the TypeBox schema
    const validateData = generateValidator(jsonSchemas.PoiEnrichedSchema);
    const isValid = validateData(parsedData);

    if (!isValid) {
      fastify.log.warn(
        { data: parsedData },
        "Gemini JSON schema response validation failed",
      );
      return {
        success: false,
        isValid: false,
        data: undefined,
      };
    }

    return {
      success: true,
      isValid,
      data: parsedData,
    };
  } catch (error) {
    fastify.log.error({ error, params }, "Gemini API request failed");

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `HTTP request failed: ${String(error)}`,
      data: undefined,
    };
  }
}
