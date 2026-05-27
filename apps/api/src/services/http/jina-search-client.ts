import {
  generateValidator,
  JinaApiResponseSchema,
  type JinaScrapeSuccessData,
  type JinaSearchParams,
} from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";
import type { KyInstance } from "ky";

import { getLogger } from "../../utils/logger.js";
import type {
  ScrapingErrorResponse,
  ScrapingResponse,
  ScrapingSuccessResponse,
} from "../processing/scraping-processor.interface.js";
import { createBaseClient } from "./base-client.js";

export type JinaSearchResponse = ScrapingResponse<JinaScrapeSuccessData>;

const validateJinaApiResponse = generateValidator(JinaApiResponseSchema);

/**
 * Create a Jina AI Search HTTP client for s.jina.ai
 */
export function createJinaSearchClient(fastify: FastifyInstance): KyInstance {
  const { apiKey } = fastify.config.jina;

  const baseClient = createBaseClient(fastify);

  return baseClient.extend({
    prefixUrl: "https://s.jina.ai",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Locale": "fr-FR",
      "X-Respond-With": "no-content",
    },
  });
}

/**
 * Call Jina AI Search API (s.jina.ai) to get search results
 */
export async function searchWithJinaSearch(
  fastify: FastifyInstance,
  params: JinaSearchParams,
): Promise<JinaSearchResponse> {
  const client = createJinaSearchClient(fastify);

  const searchParams = new URLSearchParams({
    q: params.query,
    gl: params.gl,
    num: String(params.num),
  });

  try {
    const rawResult = await client
      .get("", {
        searchParams,
      })
      .json<unknown>();

    if (!validateJinaApiResponse(rawResult)) {
      getLogger(fastify).error(
        { rawResult },
        "Jina Search API returned invalid response structure",
      );
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: "Jina Search API returned invalid response structure",
        rawResult,
      };
      return errorResponse;
    }

    const success = rawResult.code === 200;

    if (!success) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `Jina Search API returned code ${rawResult.code}, status ${rawResult.status}`,
        rawResult,
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
    getLogger(fastify).error({ error, params }, "Jina Search request failed");

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
