import {
  type GoogleMapsPlaceStrict,
  GoogleMapsPlaceStrictSchema,
  ScrapeDataScraperResponseSchema,
  validateWithSchema,
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

export interface ScrapeParams {
  query: string;
  geoCoordinates: string;
  zoom: number;
  langCode: string;
}

export interface GoogleMapsScrapeSuccessData {
  place: GoogleMapsPlaceStrict | null;
}

export type GoogleMapsScrapeResponse =
  ScrapingResponse<GoogleMapsScrapeSuccessData>;

// Legacy type for backward compatibility (deprecated)
export type ScrapeResponse = GoogleMapsScrapeResponse;

/**
 * Create a data-scraper HTTP client with Basic Auth
 */
export function createDataScraperClient(fastify: FastifyInstance): KyInstance {
  const { url, basicAuthUser, basicAuthPassword } = fastify.config.dataScraper;

  // Build Basic Auth header
  const credentials = Buffer.from(
    `${basicAuthUser}:${basicAuthPassword}`,
  ).toString("base64");

  const baseClient = createBaseClient(fastify);

  return baseClient.extend({
    prefixUrl: url,
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });
}

/**
 * Call data-scraper service to scrape Google Maps
 */
export async function scrapeGoogleMaps(
  fastify: FastifyInstance,
  params: ScrapeParams,
): Promise<GoogleMapsScrapeResponse> {
  const client = createDataScraperClient(fastify);

  // Build query parameters
  const searchParams = new URLSearchParams({
    query: params.query,
    geoCoordinates: params.geoCoordinates,
  });

  searchParams.append("zoom", String(params.zoom));
  searchParams.append("langCode", params.langCode);

  try {
    const rawResult = await client
      .get("api/scrape", {
        searchParams,
      })
      .json<unknown>();

    if (!validateWithSchema(ScrapeDataScraperResponseSchema, rawResult)) {
      getLogger(fastify).error(
        { rawResult },
        "Invalid response from data-scraper service",
      );
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: "Invalid response from data-scraper service",
        rawResult,
      };
      return errorResponse;
    }

    const validatedResult = rawResult as {
      success: boolean;
      place: GoogleMapsPlaceStrict | null;
      error?: string;
    };

    // Validate the place if it exists
    let validatedPlace: GoogleMapsPlaceStrict | null = null;
    if (validatedResult.place !== null) {
      if (
        validateWithSchema(GoogleMapsPlaceStrictSchema, validatedResult.place)
      ) {
        validatedPlace = validatedResult.place;
      } else {
        getLogger(fastify).warn(
          { place: validatedResult.place },
          "Invalid Google Maps place, returning null",
        );
      }
    }

    if (!validatedResult.success) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error:
          validatedResult.error ?? "Unknown error from data-scraper service",
        rawResult,
      };
      return errorResponse;
    }

    const successResponse: ScrapingSuccessResponse<GoogleMapsScrapeSuccessData> =
      {
        success: true,
        ...({ place: validatedPlace } as GoogleMapsScrapeSuccessData),
      };

    return successResponse;
  } catch (error) {
    getLogger(fastify).error({ error, params }, "Data scraper request failed");

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
