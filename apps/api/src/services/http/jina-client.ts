import {
  JinaApiResponseSchema,
  type JinaScrapeSuccessData,
  type JinaSearchParams,
  validateWithSchema,
} from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";
import type { KyInstance } from "ky";

import type {
  ScrapingErrorResponse,
  ScrapingResponse,
  ScrapingSuccessResponse,
} from "../processing/scraping-processor.interface.js";
import { createBaseClient } from "./base-client.js";

export type JinaScrapeResponse = ScrapingResponse<JinaScrapeSuccessData>;

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
    // hl: params.hl,
    num: String(params.num),
  });

  try {
    const rawResult = await client
      .get("", {
        searchParams,
      })
      .json<unknown>();

    // Validate the response against the JSON schema
    if (!validateWithSchema(JinaApiResponseSchema, rawResult)) {
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
    // Transform Jina API response to JinaScrapeResponse format
    const success = rawResult.code === 200 && rawResult.status === 200;

    if (!success) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `Jina AI API returned code ${rawResult.code}, status ${rawResult.status}`,
      };
      return errorResponse;
    }

    const successData: JinaScrapeSuccessData = {
      data: rawResult,
    };

    const tokens = rawResult.usage?.tokens ?? rawResult.meta?.usage?.tokens;
    if (tokens !== undefined) {
      successData.usage = { tokens };
    }

    successData.meta = {
      code: rawResult.code,
      status: rawResult.status,
      ...(tokens !== undefined ? { usage: { tokens } } : {}),
    };

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
      ...(error instanceof Error ? { errorInstance: error } : {}),
    };

    return errorResponse;
  }
}
