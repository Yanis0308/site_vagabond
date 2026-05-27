import type { FastifyInstance } from "fastify";

import {
  getEngineForUrl,
  type JinaReaderResponse,
  readUrlWithJinaReader,
} from "../../http/jina-reader-client.js";
import { JINA_READER_CONFIG } from "../../http/jina-reader-config.js";
import type {
  ProcessingMetadata,
  ScrapingProcessor,
} from "../scraping-processor.interface.js";
import { isScrapingSuccess } from "../scraping-processor.interface.js";

export interface JinaReaderParams {
  url: string;
  engine?: string;
}

/**
 * Processor for reading a single URL with Jina AI Reader (r.jina.ai)
 */
export class JinaReaderProcessor implements ScrapingProcessor<
  JinaReaderParams,
  JinaReaderResponse
> {
  execute(
    fastify: FastifyInstance,
    params: JinaReaderParams,
  ): Promise<JinaReaderResponse> {
    const { domainEngineMap, defaultEngine } = JINA_READER_CONFIG;
    const engine =
      params.engine ??
      getEngineForUrl(params.url, domainEngineMap, defaultEngine);
    return readUrlWithJinaReader(fastify, params.url, { engine });
  }

  getType(): "jina-reader" {
    return "jina-reader";
  }

  transformInput(params: JinaReaderParams): Record<string, unknown> {
    return {
      url: params.url,
      ...(params.engine !== undefined && { engine: params.engine }),
    };
  }

  transformOutput(response: JinaReaderResponse): Record<string, unknown> {
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
        ...(response.rawResult !== undefined && {
          rawResult: response.rawResult,
        }),
      };
    }
    return { ...response };
  }

  getMetadata(
    _params: JinaReaderParams,
    response: JinaReaderResponse,
  ): ProcessingMetadata | undefined {
    if (!isScrapingSuccess(response)) {
      return undefined;
    }

    if (response.usage?.tokens !== undefined) {
      return { cost: response.usage.tokens };
    }

    return undefined;
  }
}
