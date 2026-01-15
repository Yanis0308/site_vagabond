import type { FastifyInstance } from "fastify";

import {
  fetchWikidataEntity,
  type FetchWikidataParams,
  fetchWikipediaPage,
  type FetchWikipediaParams,
  type WikimediaResponse,
} from "../../http/wikimedia-client.js";
import type { ScrapingProcessor } from "../scraping-processor.interface.js";

export interface WikimediaProcessorParams {
  wikidataId?: string;
  wikipediaTitle?: string;
}

/**
 * Processor for fetching data from Wikidata or Wikipedia
 * Returns type "wikidata" or "wikipedia" based on which tag is present
 */
export class WikimediaProcessor implements ScrapingProcessor<
  WikimediaProcessorParams,
  WikimediaResponse
> {
  execute(
    fastify: FastifyInstance,
    params: WikimediaProcessorParams,
  ): Promise<WikimediaResponse> {
    if (params.wikidataId !== undefined && params.wikidataId !== "") {
      const fetchParams: FetchWikidataParams = {
        wikidataId: params.wikidataId,
      };
      return fetchWikidataEntity(fastify, fetchParams);
    }

    if (params.wikipediaTitle !== undefined && params.wikipediaTitle !== "") {
      const fetchParams: FetchWikipediaParams = {
        wikipediaTitle: params.wikipediaTitle,
      };
      return fetchWikipediaPage(fastify, fetchParams);
    }

    return Promise.resolve({
      success: false,
      error: "Either wikidataId or wikipediaTitle must be provided",
    });
  }

  getType(): "wikidata" | "wikipedia" {
    // This method is called after execute, so we need to determine the type
    // based on the params. However, since getType() doesn't have access to params,
    // we'll handle this differently in the route by creating separate processor instances
    // For now, return "wikidata" as default (will be overridden in route)
    return "wikidata";
  }

  transformInput(params: WikimediaProcessorParams): Record<string, unknown> {
    return {
      wikidataId: params.wikidataId,
      wikipediaTitle: params.wikipediaTitle,
    };
  }

  transformOutput(response: WikimediaResponse): Record<string, unknown> {
    return {
      data: response.data,
      ...(response.wikipediaData !== undefined && {
        wikipediaData: response.wikipediaData,
      }),
      ...(response.error !== undefined &&
        response.error !== "" && {
          error: response.error,
        }),
    };
  }
}

/**
 * Processor specifically for Wikidata
 */
export class WikidataProcessor implements ScrapingProcessor<
  WikimediaProcessorParams,
  WikimediaResponse
> {
  execute(
    fastify: FastifyInstance,
    params: WikimediaProcessorParams,
  ): Promise<WikimediaResponse> {
    if (params.wikidataId === undefined || params.wikidataId === "") {
      return Promise.resolve({
        success: false,
        error: "wikidataId is required",
      });
    }

    return fetchWikidataEntity(fastify, {
      wikidataId: params.wikidataId,
    });
  }

  getType(): "wikidata" {
    return "wikidata";
  }

  transformInput(params: WikimediaProcessorParams): Record<string, unknown> {
    return {
      wikidataId: params.wikidataId,
    };
  }

  transformOutput(response: WikimediaResponse): Record<string, unknown> {
    return {
      data: response.data,
      ...(response.wikipediaData !== undefined && {
        wikipediaData: response.wikipediaData,
      }),
      ...(response.error !== undefined &&
        response.error !== "" && {
          error: response.error,
        }),
    };
  }
}

/**
 * Processor specifically for Wikipedia
 */
export class WikipediaProcessor implements ScrapingProcessor<
  WikimediaProcessorParams,
  WikimediaResponse
> {
  execute(
    fastify: FastifyInstance,
    params: WikimediaProcessorParams,
  ): Promise<WikimediaResponse> {
    if (params.wikipediaTitle === undefined || params.wikipediaTitle === "") {
      return Promise.resolve({
        success: false,
        error: "wikipediaTitle is required",
      });
    }

    return fetchWikipediaPage(fastify, {
      wikipediaTitle: params.wikipediaTitle,
    });
  }

  getType(): "wikipedia" {
    return "wikipedia";
  }

  transformInput(params: WikimediaProcessorParams): Record<string, unknown> {
    return {
      wikipediaTitle: params.wikipediaTitle,
    };
  }

  transformOutput(response: WikimediaResponse): Record<string, unknown> {
    return {
      data: response.data,
      ...(response.wikipediaData !== undefined && {
        wikipediaData: response.wikipediaData,
      }),
      ...(response.error !== undefined &&
        response.error !== "" && {
          error: response.error,
        }),
    };
  }
}
