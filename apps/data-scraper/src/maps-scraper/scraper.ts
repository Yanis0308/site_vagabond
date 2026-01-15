import type { GoogleMapsPlaceStrict } from "@vagabond/shared-utils";
import type { Page } from "puppeteer";

import { navigateToPlacePageAndExtract } from "./handlers/extraction.js";
import {
  checkForSinglePlace,
  extractPlaceLinks,
  navigateToSearchPage,
} from "./handlers/navigation.js";
import { logUtils } from "./utils/logging.js";
import { buildSearchURL } from "./utils/url.js";

/**
 * Scrape Google Maps using an existing page (reuses the same page)
 * @param page Existing Puppeteer page to reuse
 * @param query Search query
 * @param options Scraping options
 * @returns List of extracted and validated places (invalid places are rejected)
 */
export async function scrapeGoogleMapsWithPage(
  page: Page,
  query: string,
  options: {
    langCode?: string;
    maxResults?: number;
    geoCoordinates?: string;
    zoom?: number;
  } = {},
): Promise<GoogleMapsPlaceStrict | null> {
  const prefix = "SCRAPE";
  const emoji = "🚀";

  logUtils.separator("=", 60);
  logUtils.log(prefix, emoji, "Starting Google Maps scrape");
  logUtils.log(prefix, emoji, `Query: "${query}"`);

  const { langCode = "en", maxResults, geoCoordinates, zoom = 15 } = options;
  logUtils.log(
    prefix,
    emoji,
    `Options: langCode=${langCode}, maxResults=${maxResults ?? "unlimited"}, geoCoordinates=${geoCoordinates ?? "none"}, zoom=${zoom}`,
  );

  // Build search URL
  const searchURL = buildSearchURL(query, langCode, geoCoordinates, zoom);
  logUtils.log(prefix, emoji, `Built search URL: ${searchURL}`);

  // Navigate to search page
  logUtils.step("1", "4", "Navigating to search page...");
  const isSinglePlaceFromNavigation = await navigateToSearchPage(
    page,
    searchURL,
  );

  // Check if we're on a single Place page (only if not already detected during navigation)
  let isSinglePlace: boolean;
  if (isSinglePlaceFromNavigation) {
    logUtils.log(
      prefix,
      emoji,
      "Single Place page already detected during navigation, skipping check",
    );
    isSinglePlace = true;
  } else {
    logUtils.step("2", "4", "Checking if single Place page...");
    isSinglePlace = await checkForSinglePlace(page);
  }

  let place: GoogleMapsPlaceStrict | null = null;
  let rejectedCount = 0;

  if (isSinglePlace) {
    logUtils.step(
      "3",
      "4",
      "Single Place page detected, re-navigating to ensure APP_INITIALIZATION_STATE is correct...",
    );
    // Re-navigate to current URL to ensure APP_INITIALIZATION_STATE is properly initialized
    const currentURL = page.url();
    const entry = await navigateToPlacePageAndExtract(
      page,
      currentURL,
      langCode,
    );

    if (entry !== null) {
      place = entry;
      logUtils.success(prefix, emoji, "Successfully extracted 1 place");
    } else {
      rejectedCount++;
      logUtils.warn(prefix, emoji, "Place rejected: validation failed");
    }
  } else {
    logUtils.step("3", "4", "Extracting Place links from results page...");
    // Extract Place links (first page only)
    const placeLinks = await extractPlaceLinks(page, maxResults);

    logUtils.success(prefix, emoji, `Found ${placeLinks.length} Place links`);

    // For each link, extract data
    logUtils.step("4", "4", `Processing ${placeLinks.length} places...`);
    const link = placeLinks[0];
    if (link !== undefined) {
      logUtils.separator("-", 60);
      logUtils.log(
        prefix,
        emoji,
        `Processing place 1/${placeLinks.length}: ${link}`,
      );

      try {
        const entry = await navigateToPlacePageAndExtract(page, link, langCode);

        if (entry !== null) {
          place = entry;
          logUtils.success(
            prefix,
            emoji,
            `Successfully extracted place 1/${placeLinks.length}`,
          );
        } else {
          rejectedCount++;
          logUtils.warn(
            prefix,
            emoji,
            `Place 1/${placeLinks.length} rejected: validation failed`,
          );
        }
      } catch (error) {
        logUtils.error(
          prefix,
          emoji,
          `Error scraping place 1/${placeLinks.length} (${link})`,
          error,
        );
      }
    } else {
      logUtils.warn(prefix, emoji, "No place links found");
    }
  }

  logUtils.separator("=", 60);
  logUtils.success(
    prefix,
    emoji,
    `Scraping completed! Extracted ${place !== null ? 1 : 0} valid place(s)${rejectedCount > 0 ? `, ${rejectedCount} rejected` : ""}`,
  );
  logUtils.separator("=", 60);
  logUtils.log(prefix, emoji, "");

  return place;
}
