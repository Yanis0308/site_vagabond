import {
  generateValidator,
  type GoogleMapsPlaceStrict,
  GoogleMapsPlaceStrictSchema,
  jsonSchemas,
} from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";
import type { KyInstance } from "ky";

import { createBaseClient } from "./base-client.js";

export interface ScrapeParams {
  query: string;
  geoCoordinates: string;
  zoom: number;
  langCode: string;
}

export interface GoogleMapsScrapeResponse {
  success: boolean;
  place: GoogleMapsPlaceStrict | null;
  error?: string;
}

// Legacy type for backward compatibility (deprecated)
export type ScrapeResponse = GoogleMapsScrapeResponse;

const validateResponse = generateValidator(
  jsonSchemas.ScrapeDataScraperResponseSchema,
);

const validateGoogleMapsPlace = generateValidator(GoogleMapsPlaceStrictSchema);

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

    if (!validateResponse(rawResult)) {
      throw new Error("Invalid response from data-scraper service");
    }

    const validatedResult = rawResult as {
      success: boolean;
      place: GoogleMapsPlaceStrict | null;
      error?: string;
    };

    // Validate the place if it exists
    let validatedPlace: GoogleMapsPlaceStrict | null = null;
    if (validatedResult.place !== null && validatedResult.place !== undefined) {
      if (validateGoogleMapsPlace(validatedResult.place)) {
        validatedPlace = validatedResult.place;
      } else {
        fastify.log.warn(
          { place: validatedResult.place },
          "Invalid Google Maps place, returning null",
        );
      }
    }

    return {
      success: validatedResult.success,
      place: validatedPlace,
      ...(validatedResult.error !== undefined &&
        validatedResult.error !== "" && { error: validatedResult.error }),
    };
  } catch (error) {
    fastify.log.error({ error, params }, "Data scraper request failed");

    return {
      success: false,
      place: null,
      error:
        error instanceof Error
          ? error.message
          : `HTTP request failed: ${String(error)}`,
    };
  }
}
