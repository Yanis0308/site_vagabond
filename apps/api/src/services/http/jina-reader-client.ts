import {
  FormattedPageSchema,
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
import { JINA_READER_CONFIG } from "./jina-reader-config.js";

export interface JinaReaderSuccessData {
  title: string;
  content: string;
  url: string;
  description?: string;
  usage?: { tokens?: number };
}

export type JinaReaderResponse = ScrapingResponse<JinaReaderSuccessData>;

/**
 * Returns the X-Engine value for a given URL based on domain config.
 */
export function getEngineForUrl(
  url: string,
  domainEngineMap: Record<string, string>,
  defaultEngine: string,
): string {
  try {
    const hostname = new URL(url).hostname;
    for (const [domain, engine] of Object.entries(domainEngineMap)) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return engine;
      }
    }
  } catch {
    // invalid URL, fallback to default
  }
  return defaultEngine;
}

/**
 * Create a Jina AI Reader HTTP client for r.jina.ai
 */
export function createJinaReaderClient(
  fastify: FastifyInstance,
  engine: string,
): KyInstance {
  const { apiKey } = fastify.config.jina;

  const baseClient = createBaseClient(fastify);

  return baseClient.extend({
    prefixUrl: "https://r.jina.ai",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Locale": "fr-FR",
      "X-Engine": engine,
    },
  });
}

/**
 * Read a URL with Jina AI Reader (POST r.jina.ai)
 */
export async function readUrlWithJinaReader(
  fastify: FastifyInstance,
  url: string,
  options?: { engine?: string },
): Promise<JinaReaderResponse> {
  const { domainEngineMap, defaultEngine } = JINA_READER_CONFIG;
  const engine =
    options?.engine ?? getEngineForUrl(url, domainEngineMap, defaultEngine);
  const client = createJinaReaderClient(fastify, engine);

  try {
    const rawResult = await client
      .post("", {
        json: { url },
      })
      .json<unknown>();

    const envelope = rawResult as {
      code?: number;
      status?: number;
      data?: unknown;
    };

    if (envelope.code !== undefined && envelope.code >= 400) {
      fastify.log.error(
        { rawResult, url, code: envelope.code },
        "Jina Reader API returned error",
      );
      return {
        success: false,
        error: `Jina Reader API error: ${envelope.code}`,
      };
    }

    const pageData = envelope.data;

    if (!validateWithSchema(FormattedPageSchema, pageData)) {
      fastify.log.error(
        { rawResult, url },
        "Jina Reader API returned invalid response structure",
      );
      return {
        success: false,
        error: "Jina Reader API returned invalid response structure",
      };
    }

    const validatedPage = pageData as {
      url: string;
      title: string;
      content: string;
      description?: string;
      usage?: { tokens?: number };
    };

    const successData: JinaReaderSuccessData = {
      title: validatedPage.title,
      content: validatedPage.content,
      url: validatedPage.url,
      ...(validatedPage.description !== undefined && {
        description: validatedPage.description,
      }),
      ...(validatedPage.usage !== undefined && { usage: validatedPage.usage }),
    };

    const successResponse: ScrapingSuccessResponse<JinaReaderSuccessData> = {
      success: true,
      ...successData,
    };

    return successResponse;
  } catch (error) {
    fastify.log.error({ error, url }, "Jina Reader request failed");

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
