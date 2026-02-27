import type { JinaSearchParams } from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";

import {
  type JinaSearchResponse,
  searchWithJinaSearch,
} from "../../http/jina-search-client.js";
import type {
  ProcessingMetadata,
  ScrapingProcessor,
} from "../scraping-processor.interface.js";
import { isScrapingSuccess } from "../scraping-processor.interface.js";

/**
 * Processor for web search using Jina AI Search API (s.jina.ai)
 */
export class JinaSearchProcessor implements ScrapingProcessor<
  JinaSearchParams,
  JinaSearchResponse
> {
  execute(
    fastify: FastifyInstance,
    params: JinaSearchParams,
  ): Promise<JinaSearchResponse> {
    return searchWithJinaSearch(fastify, params);
  }

  getType(): "jina-search" {
    return "jina-search";
  }

  transformInput(params: JinaSearchParams): Record<string, unknown> {
    return {
      query: params.query,
      gl: params.gl,
      num: params.num,
    };
  }

  transformOutput(response: JinaSearchResponse): Record<string, unknown> {
    // Store full response as-is for JSONB (errorInstance serialized for JSON)
    if (!response.success) {
      return {
        success: false,
        error: response.error,
        ...(response.errorInstance !== undefined && {
          errorInstance: {
            message: response.errorInstance.message,
            stack: response.errorInstance.stack,
            name: response.errorInstance.name,
          },
        }),
      } as Record<string, unknown>;
    }
    return { ...response } as Record<string, unknown>;
  }

  getMetadata(
    _params: JinaSearchParams,
    response: JinaSearchResponse,
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
