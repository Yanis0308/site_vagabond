import type { FastifyInstance } from "fastify";
import { getDistance } from "geolib";

import {
  type GoogleMapsScrapeResponse,
  scrapeGoogleMaps,
  type ScrapeParams,
} from "../../http/data-scraper-client.js";
import type {
  ProcessingMetadata,
  ScrapingProcessor,
} from "../scraping-processor.interface.js";
import { isScrapingSuccess } from "../scraping-processor.interface.js";

/**
 * Processor for Google Maps scraping via data-scraper service
 */
export class GoogleMapsScrapingProcessor implements ScrapingProcessor<
  ScrapeParams,
  GoogleMapsScrapeResponse
> {
  execute(
    fastify: FastifyInstance,
    params: ScrapeParams,
  ): Promise<GoogleMapsScrapeResponse> {
    return scrapeGoogleMaps(fastify, params);
  }

  getType(): "scraper-maps" {
    return "scraper-maps";
  }

  transformInput(params: ScrapeParams): Record<string, unknown> {
    return {
      query: params.query,
      geoCoordinates: params.geoCoordinates,
      zoom: params.zoom,
      langCode: params.langCode,
    };
  }

  transformOutput(response: GoogleMapsScrapeResponse): Record<string, unknown> {
    if (!isScrapingSuccess(response)) {
      return {
        error: response.error,
        ...(response.rawResult !== undefined && {
          rawResult: response.rawResult,
        }),
      };
    }

    return {
      place: response.place,
    };
  }

  getMetadata(
    params: ScrapeParams,
    response: GoogleMapsScrapeResponse,
  ): ProcessingMetadata {
    const metadata: ProcessingMetadata = {};

    if (!isScrapingSuccess(response)) {
      // If request failed, response is not valid
      metadata.isValid = false;
      return metadata;
    }

    // Place is already validated in data-scraper-client
    // Only consider valid if the place exists and response was successful
    if (response.place !== null) {
      metadata.isValid = true;

      // Calculate distance (informational only)
      // Parse POI coordinates from "lat,lng" format
      const [poiLatStr, poiLngStr] = params.geoCoordinates.split(",");
      const poiLat = parseFloat(poiLatStr ?? "");
      const poiLng = parseFloat(poiLngStr ?? "");

      // Get place coordinates (already validated as GoogleMapsPlaceStrict)
      const placeLat = response.place.latitude;
      const placeLng = response.place.longitude;

      // Calculate distance if both coordinates are valid
      if (
        !isNaN(poiLat) &&
        !isNaN(poiLng) &&
        typeof placeLat === "number" &&
        typeof placeLng === "number" &&
        !isNaN(placeLat) &&
        !isNaN(placeLng)
      ) {
        const distance = getDistance(
          { latitude: poiLat, longitude: poiLng },
          { latitude: placeLat, longitude: placeLng },
        );

        metadata.distance = distance;
      }
    } else {
      // If no place, response is not valid
      metadata.isValid = false;
    }

    return metadata;
  }
}
