import type { FastifyInstance } from "fastify";

import {
  type JinaScrapeResponse,
  type JinaSearchParams,
  searchWithJina,
} from "../../http/jina-client.js";
import type {
  ProcessingMetadata,
  ScrapingProcessor,
} from "../scraping-processor.interface.js";
import { isScrapingSuccess } from "../scraping-processor.interface.js";

/**
 * Processor for web scraping using Jina AI Serp API
 */
export class JinaWebScrapingProcessor implements ScrapingProcessor<
  JinaSearchParams,
  JinaScrapeResponse
> {
  execute(
    fastify: FastifyInstance,
    params: JinaSearchParams,
  ): Promise<JinaScrapeResponse> {
    return searchWithJina(fastify, params);
  }

  getType(): "scraper-web" {
    return "scraper-web";
  }

  transformInput(params: JinaSearchParams): Record<string, unknown> {
    return {
      query: params.query,
      gl: params.gl,
      hl: params.hl,
      num: params.num,
    };
  }

  transformOutput(response: JinaScrapeResponse): Record<string, unknown> {
    if (!isScrapingSuccess(response)) {
      return {
        error: response.error,
      };
    }

    return {
      data: response.data,
    };
  }

  getMetadata(
    _params: JinaSearchParams,
    response: JinaScrapeResponse,
  ): ProcessingMetadata | undefined {
    if (!isScrapingSuccess(response)) {
      return undefined;
    }

    const tokens = response.usage?.tokens ?? response.meta?.usage?.tokens;
    const metadata: ProcessingMetadata = {};

    if (tokens !== undefined) {
      metadata.cost = tokens;
    }

    if (response.meta !== undefined) {
      metadata.metadata = {
        code: response.meta.code,
        status: response.meta.status,
        ...(response.meta.usage !== undefined && {
          usage: {
            tokens: response.meta.usage.tokens,
          },
        }),
      };
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }
}
