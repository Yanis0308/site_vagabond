import type { FastifyInstance } from "fastify";
import type { KyInstance } from "ky";

import { createBaseClient } from "./base-client.js";

export interface JinaSearchParams {
  query: string;
  gl: string; // Country code (e.g., "FR")
  hl: string; // Language code (e.g., "fr")
  num: number; // Number of results (default: 5)
}

export type JinaSearchResponse = Record<string, unknown>;

export interface JinaApiResponse {
  code: number;
  status: number;
  data?: unknown[];
  meta?: {
    usage?: {
      tokens?: number;
    };
  };
}

export interface JinaScrapeResponse {
  success: boolean;
  data?: JinaSearchResponse;
  error?: string;
}

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
    const result = await client
      .get("", {
        searchParams,
      })
      .json<JinaApiResponse>();

    // Transform Jina API response to JinaScrapeResponse format
    const success = result.code === 200 && result.status === 20000;

    return {
      success,
      data: result as unknown as JinaSearchResponse,
      ...(!success && {
        error: `Jina AI API returned code ${result.code}, status ${result.status}`,
      }),
    };
  } catch (error) {
    fastify.log.error({ error, params }, "Jina AI request failed");

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `HTTP request failed: ${String(error)}`,
    };
  }
}
