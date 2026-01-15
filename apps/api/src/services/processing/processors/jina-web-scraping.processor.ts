import type { FastifyInstance } from "fastify";

import {
  type JinaScrapeResponse,
  type JinaSearchParams,
  searchWithJina,
} from "../../http/jina-client.js";
import type { ScrapingProcessor } from "../scraping-processor.interface.js";

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
    return {
      data: response.data,
    };
  }
}
