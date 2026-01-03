import type { Page } from "puppeteer";

import { navigateToPlacePageAndExtract } from "./handlers/extraction.js";
import {
  checkForSinglePlace,
  extractPlaceLinks,
  navigateToSearchPage,
} from "./handlers/navigation.js";
import type { PlaceEntry } from "./types/PlaceEntry.js";
import { logUtils } from "./utils/logging.js";
import { buildSearchURL } from "./utils/url.js";

/**
 * Scrape Google Maps using an existing page (reuses the same page)
 * @param page Existing Puppeteer page to reuse
 * @param query Search query
 * @param options Scraping options
 * @returns List of extracted places
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
): Promise<PlaceEntry[]> {
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

  const placeEntries: PlaceEntry[] = [];

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
    placeEntries.push(entry);
    logUtils.success(prefix, emoji, "Successfully extracted 1 place");
  } else {
    logUtils.step("3", "4", "Extracting Place links from results page...");
    // Extract Place links (first page only)
    const placeLinks = await extractPlaceLinks(page, maxResults);

    logUtils.success(prefix, emoji, `Found ${placeLinks.length} Place links`);

    // For each link, extract data
    logUtils.step("4", "4", `Processing ${placeLinks.length} places...`);
    for (let i = 0; i < placeLinks.length; i++) {
      const link = placeLinks[i];
      if (link === undefined) continue;

      logUtils.separator("-", 60);
      logUtils.log(
        prefix,
        emoji,
        `Processing place ${i + 1}/${placeLinks.length}: ${link}`,
      );

      try {
        const entry = await navigateToPlacePageAndExtract(page, link, langCode);
        placeEntries.push(entry);
        logUtils.success(
          prefix,
          emoji,
          `Successfully extracted place ${i + 1}/${placeLinks.length}`,
        );

        // Wait a bit between requests
        // if (i < placeLinks.length - 1) {
        //   await wait(1000);
        // }
      } catch (error) {
        logUtils.error(
          prefix,
          emoji,
          `Error scraping place ${i + 1}/${placeLinks.length} (${link})`,
          error,
        );
      }
    }
  }

  logUtils.separator("=", 60);
  logUtils.success(
    prefix,
    emoji,
    `Scraping completed! Extracted ${placeEntries.length} place(s)`,
  );
  logUtils.separator("=", 60);
  logUtils.log(prefix, emoji, "");

  return placeEntries;
}
