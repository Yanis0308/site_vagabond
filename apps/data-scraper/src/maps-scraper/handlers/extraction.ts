import type { Page } from "puppeteer";

import { extractPlaceData } from "../extractors/placeExtractor.js";
import { parsePlaceData } from "../parsers/placeData.js";
import type { PlaceEntry } from "../types/PlaceEntry.js";
import { logUtils } from "../utils/logging.js";
import {
  clickRejectCookiesIfRequired,
  waitForCookieConsentToDisappear,
} from "./cookies.js";

/**
 * Extract place data from current page (without navigation)
 */
export async function extractPlaceFromCurrentPage(
  page: Page,
  placeURL: string,
): Promise<PlaceEntry> {
  const prefix = "EXTRACT";
  const emoji = "📄";

  logUtils.log(
    prefix,
    emoji,
    `Extracting place data from current page: ${placeURL}`,
  );
  // Wait for page to fully load - try multiple selectors for Place page elements
  // (supports different languages and page variations)
  const placePageSelectors = [
    // Primary indicators - most reliable
    'h1[data-attrid="title"]', // Place title (most reliable indicator)
    '[data-feature-name="Directions"]', // Feature name
    'div[role="main"]', // Main content panel

    // Directions button variants (multiple languages)
    '[data-value="Directions"]', // English
    '[data-value="Itinéraire"]', // French
    'button[data-value*="Direction"]', // Partial match
    'button[aria-label*="Direction"]', // Aria label variant
    'button[aria-label*="Itinéraire"]', // French aria label
    '[role="button"][aria-label*="Direction"]', // Role button variant
    '[role="button"][aria-label*="Itinéraire"]', // French role button

    // Additional Place page indicators
    'div[role="img"][aria-label*="star"]', // Rating stars
    'div[jsaction*="pane.rating"]', // Rating container
  ];

  logUtils.log(prefix, emoji, "Waiting for Place page to load");
  let pageLoaded = false;

  // Use waitForFunction to check for multiple conditions at once
  // This is more efficient and robust than checking selectors one by one
  try {
    await page.waitForFunction(
      (selectors: string[]) => {
        // Check if any of the selectors exist in the DOM
        for (const selector of selectors) {
          try {
            if (document.querySelector(selector) !== null) {
              return true;
            }
          } catch {
            // Invalid selector, continue
          }
        }
        return false;
      },
      { timeout: 5000 },
      placePageSelectors,
    );
    logUtils.success(prefix, emoji, "Place page loaded - elements found");
    pageLoaded = true;
  } catch {
    // Fallback to individual selector checks
    logUtils.warn(
      prefix,
      emoji,
      "waitForFunction failed, trying individual selectors...",
    );
    for (const selector of placePageSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        logUtils.success(
          prefix,
          emoji,
          `Place page loaded (found: ${selector})`,
        );
        pageLoaded = true;
        break;
      } catch {
        // Continue to next selector
      }
    }
  }

  // If no Directions button found, wait for DOM to be stable
  if (!pageLoaded) {
    logUtils.warn(
      prefix,
      emoji,
      "Directions button not found, waiting for DOM to stabilize...",
    );
    try {
      await page.waitForFunction(
        () => {
          return (
            document.body !== undefined &&
            document.readyState === "complete" &&
            document.querySelector("body") !== null
          );
        },
        { timeout: 5000 },
      );
      logUtils.success(prefix, emoji, "DOM stabilized, page ready");
    } catch {
      logUtils.warn(prefix, emoji, "Continuing despite stability check");
    }
  }

  logUtils.log(prefix, emoji, "Extracting JSON data...");
  // Extract JSON data
  const rawData = await extractPlaceData(page);
  if (rawData === null) {
    throw new Error("Failed to extract place data");
  }
  logUtils.success(prefix, emoji, "JSON data extracted, parsing...");
  const entry = parsePlaceData(rawData);
  entry.link = placeURL;
  logUtils.success(
    prefix,
    emoji,
    "Place data extracted and parsed successfully",
  );

  return entry;
}

/**
 * Navigate to Place page and extract data
 */
export async function navigateToPlacePageAndExtract(
  page: Page,
  placeURL: string,
  langCode: string,
): Promise<PlaceEntry> {
  const prefix = "NAVIGATE PLACE";
  const emoji = "🔗";

  logUtils.log(prefix, emoji, "Starting navigation to Place page");
  const url = new URL(placeURL);
  url.searchParams.set("hl", langCode);

  logUtils.log(
    prefix,
    emoji,
    `Navigating to: ${url.toString()} (waiting for domcontentloaded)`,
  );
  await page.goto(url.toString(), {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  logUtils.success(prefix, emoji, "Navigation completed");

  // Handle cookie consent
  logUtils.log(prefix, emoji, "Handling cookie consent...");
  const cookieClicked = await clickRejectCookiesIfRequired(page);

  // If cookies were clicked, wait for DOM to stabilize
  if (cookieClicked) {
    logUtils.log(
      prefix,
      emoji,
      "Cookie was clicked, waiting for DOM to stabilize...",
    );
    await waitForCookieConsentToDisappear(page);
  } else {
    logUtils.log(prefix, emoji, "No cookie consent found or already handled");
  }

  return await extractPlaceFromCurrentPage(page, placeURL);
}
