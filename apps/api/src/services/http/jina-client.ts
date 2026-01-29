import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";
import type { KyInstance } from "ky";
import { type Static } from "typebox";

import type {
  ScrapingErrorResponse,
  ScrapingResponse,
  ScrapingSuccessResponse,
} from "../processing/scraping-processor.interface.js";
import { createBaseClient } from "./base-client.js";

export interface JinaSearchParams {
  query: string;
  gl: string; // Country code (e.g., "FR")
  hl: string; // Language code (e.g., "fr")
  num: number; // Number of results (default: 5)
}

export type JinaSearchResponse = Record<string, unknown>;

export type JinaDataItem = Static<typeof jsonSchemas.JinaDataItemSchema>;

export type JinaApiResponse = Static<typeof jsonSchemas.JinaApiResponseSchema>;

export interface JinaScrapeSuccessData {
  data: JinaSearchResponse;
  usage?: {
    tokens?: number;
  };
  meta?: {
    code?: number;
    status?: number;
    usage?: {
      tokens?: number;
    };
  };
}

export type JinaScrapeResponse = ScrapingResponse<JinaScrapeSuccessData>;

const validateJinaResponse = generateValidator(
  jsonSchemas.JinaApiResponseSchema,
);

/**
 * Create a Jina AI HTTP client with Bearer Auth
 */
export function createJinaClient(fastify: FastifyInstance): KyInstance {
  const { apiKey } = fastify.config.jina;

  const baseClient = createBaseClient(fastify);

  return baseClient.extend({
    prefixUrl: "https://s.jina.ai",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Locale": "fr-FR",
      // "X-Respond-With": "readerlm-v2",
      "X-With-Images-Summary": "true",
      "X-Retain-Images": "none",
      "X-With-Generated-Alt": "true",
      "X-Engine": "direct",
    },
  });
}

/**
 * Call Jina AI Serp API to scrape search results
 */
export async function searchWithJina(
  fastify: FastifyInstance,
  params: JinaSearchParams,
): Promise<JinaScrapeResponse> {
  const client = createJinaClient(fastify);

  // Build query parameters
  const searchParams = new URLSearchParams({
    q: params.query,
    gl: params.gl,
    hl: params.hl,
    num: String(params.num),
  });

  try {
    const rawResult = await client
      .get("", {
        searchParams,
      })
      .json<unknown>();

    // Validate the response against the JSON schema
    if (!validateJinaResponse(rawResult)) {
      fastify.log.error(
        { rawResult },
        "Jina AI API returned invalid response structure",
      );
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: "Jina AI API returned invalid response structure",
      };
      return errorResponse;
    }

    const result = rawResult;

    // Transform Jina API response to JinaScrapeResponse format
    const success = result.code === 200 && result.status === 20000;

    if (!success) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `Jina AI API returned code ${result.code}, status ${result.status}`,
      };
      return errorResponse;
    }

    const successData: JinaScrapeSuccessData = {
      data: result as unknown as JinaSearchResponse,
    };

    if (result.meta?.usage?.tokens !== undefined) {
      successData.usage = {
        tokens: result.meta.usage.tokens,
      };
    }

    if (result.meta !== undefined) {
      successData.meta = {
        code: result.code,
        status: result.status,
      };
      if (result.meta.usage?.tokens !== undefined) {
        successData.meta.usage = {
          tokens: result.meta.usage.tokens,
        };
      }
    }

    const successResponse: ScrapingSuccessResponse<JinaScrapeSuccessData> = {
      success: true,
      ...successData,
    };

    return successResponse;
  } catch (error) {
    fastify.log.error({ error, params }, "Jina AI request failed");

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
}
