import type { Page } from "puppeteer";

import { logUtils } from "../utils/logging.js";
import {
  clickRejectCookiesIfRequired,
  waitForCookieConsentToDisappear,
} from "./cookies.js";

/**
 * Check if the page shows "no results" message
 * This allows us to quickly detect empty results and skip unnecessary timeouts
 */
export async function checkForNoResults(page: Page): Promise<boolean> {
  const prefix = "NO RESULTS";
  const emoji = "🚫";

  logUtils.log(prefix, emoji, "Checking for no results indicators...");

  try {
    // Check multiple indicators that suggest no results were found
    const hasNoResults = await page.evaluate(() => {
      // Check for empty feed (feed exists but has no child links)
      const feed = document.querySelector('div[role="feed"]');
      if (feed !== null) {
        const links = feed.querySelectorAll('a[href*="/maps/place/"]');
        if (links.length === 0) {
          return true; // Feed exists but empty
        }
      }

      // Check for common "no results" text patterns (multiple languages)
      const bodyText = document.body.textContent ?? "";
      const noResultsPatterns = [
        "impossible de trouver", // French - primary pattern from Google Maps
        "aucun résultat", // French
        "no results", // English
        "pas de résultat", // French alternative
        "aucun lieu correspondant", // French
        "no places found", // English
        "unable to find", // English alternative
        "keine ergebnisse", // German
        "sin resultados", // Spanish
        "nessun risultato", // Italian
      ];

      for (const pattern of noResultsPatterns) {
        if (bodyText.toLowerCase().includes(pattern)) {
          return true;
        }
      }

      // Check for specific "no results" UI elements
      // Google Maps sometimes shows specific aria-labels or data attributes for no results
      const noResultsSelectors = [
        '[aria-label*="aucun résultat"]',
        '[aria-label*="no results"]',
        '[data-value*="no results"]',
      ];

      for (const selector of noResultsSelectors) {
        if (document.querySelector(selector) !== null) {
          return true;
        }
      }

      return false;
    });

    if (hasNoResults) {
      logUtils.success(
        prefix,
        emoji,
        "No results detected - empty results page",
      );
      return true;
    } else {
      logUtils.log(prefix, emoji, "Results seem to be present");
      return false;
    }
  } catch {
    logUtils.warn(
      prefix,
      emoji,
      "Error checking for no results, assuming results exist",
    );
    return false;
  }
}

/**
 * Navigate to search page and handle cookies
 * @returns true if redirected to a single Place page, false otherwise
 */
export async function navigateToSearchPage(
  page: Page,
  url: string,
): Promise<boolean> {
  const prefix = "NAVIGATE";
  const emoji = "🔍";

  logUtils.log(prefix, emoji, "Starting navigation to search page");
  logUtils.log(
    prefix,
    emoji,
    `Navigating to: ${url} (waiting for domcontentloaded)`,
  );

  // Navigate to page
  await page.goto(url, {
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

  // Quick check for no results to avoid unnecessary timeouts
  const hasNoResults = await checkForNoResults(page);
  if (hasNoResults) {
    logUtils.warn(prefix, emoji, "No results found - skipping timeouts");
    return false; // Empty results page
  }

  // Wait for page to load - check for either feed selector OR redirect to Place page
  // This handles cases where we get redirected to a single Place page
  logUtils.log(
    prefix,
    emoji,
    `Waiting for feed selector (div[role="feed"]) or Place page redirect`,
  );

  try {
    // Wait for either the feed selector OR a redirect to Place page
    await page.waitForFunction(
      () => {
        // Check if we're on a Place page
        if (window.location.href.includes("/maps/place/")) {
          return true;
        }
        // Check if feed selector exists
        return document.querySelector('div[role="feed"]') !== null;
      },
      { timeout: 5000 },
    );

    // Check which condition was met
    const currentURL = page.url();
    if (currentURL.includes("/maps/place/")) {
      logUtils.success(
        prefix,
        emoji,
        "Redirected to single Place page detected",
      );
      // Wait for DOM to stabilize on Place page
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
        logUtils.success(prefix, emoji, "Place page stabilized, DOM ready");
      } catch {
        // If DOM stability check fails, try waiting for any visible content
        try {
          await page.waitForSelector("body", { timeout: 2000 });
          logUtils.success(prefix, emoji, "Body element found");
        } catch {
          logUtils.warn(
            prefix,
            emoji,
            "Continuing despite stability check failure",
          );
        }
      }
      return true; // Single Place page detected
    } else {
      logUtils.success(prefix, emoji, "Feed selector found, page loaded");
      return false; // Results page
    }
  } catch {
    // Neither feed nor Place page detected within timeout
    // Check URL one more time in case redirect happened
    const currentURL = page.url();
    if (currentURL.includes("/maps/place/")) {
      logUtils.success(
        prefix,
        emoji,
        "Place page detected via URL check (after timeout)",
      );
      // Wait for DOM to stabilize
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
        logUtils.success(prefix, emoji, "Place page stabilized, DOM ready");
      } catch {
        try {
          await page.waitForSelector("body", { timeout: 2000 });
          logUtils.success(prefix, emoji, "Body element found");
        } catch {
          logUtils.warn(
            prefix,
            emoji,
            "Continuing despite stability check failure",
          );
        }
      }
      return true; // Single Place page detected
    } else {
      logUtils.warn(
        prefix,
        emoji,
        "Feed selector not found and no Place page redirect detected, waiting for page to stabilize...",
      );
      // If feed selector not found, wait for DOM to be stable
      // Check that body is loaded and DOM is ready
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
        logUtils.success(prefix, emoji, "Page stabilized, DOM ready");
      } catch {
        // If DOM stability check fails, try waiting for any visible content
        try {
          await page.waitForSelector("body", { timeout: 2000 });
          logUtils.success(prefix, emoji, "Body element found");
        } catch {
          logUtils.warn(
            prefix,
            emoji,
            "Continuing despite stability check failure",
          );
        }
      }
      return false; // Results page (or unknown)
    }
  }
}

/**
 * Check if we're on a single Place page (redirected from search)
 */
export async function checkForSinglePlace(page: Page): Promise<boolean> {
  const prefix = "CHECK PLACE";
  const emoji = "📍";

  logUtils.log(prefix, emoji, "Checking if we're on a single Place page...");
  const feedSelector = 'div[role="feed"]';

  logUtils.log(prefix, emoji, "Checking for feed selector");
  try {
    await page.waitForSelector(feedSelector, { timeout: 700 });
    logUtils.success(
      prefix,
      emoji,
      "Feed found - we're on a results page (not single place)",
    );
    return false; // Results list found
  } catch {
    logUtils.warn(
      prefix,
      emoji,
      "No feed found, checking if redirected to Place page...",
    );
    // No feed found, check if we're on a Place page
    // Wait for URL to contain "/maps/place/" and page to be stable
    try {
      logUtils.log(prefix, emoji, `Waiting for URL to contain "/maps/place/"`);
      // Wait for URL to change to a Place page
      await page.waitForFunction(
        () => window.location.href.includes("/maps/place/"),
        { timeout: 5000 },
      );
      logUtils.success(
        prefix,
        emoji,
        `URL contains "/maps/place/" - checking page stability...`,
      );

      // Try multiple selectors to detect Place page elements
      // This makes detection more robust across different languages and page variations
      const placePageSelectors = [
        // Primary indicators - most reliable
        'h1[data-attrid="title"]', // Place title (most reliable indicator)
        '[data-feature-name="Directions"]', // Feature name
        'div[role="main"]', // Main content panel (Place pages have this)

        // Directions button variants (multiple languages)
        '[data-value="Directions"]', // English
        '[data-value="Itinéraire"]', // French
        'button[data-value*="Direction"]', // Partial match
        'button[aria-label*="Direction"]', // Aria label variant
        'button[aria-label*="Itinéraire"]', // French aria label
        '[role="button"][aria-label*="Direction"]', // Role button variant
        '[role="button"][aria-label*="Itinéraire"]', // French role button

        // Additional Place page indicators
        'button[data-value="Save"]', // Save button (English)
        'button[data-value="Enregistrer"]', // Save button (French)
        'button[data-value="Share"]', // Share button (English)
        'button[data-value="Partager"]', // Share button (French)
        'div[role="img"][aria-label*="star"]', // Rating stars
        'div[jsaction*="pane.rating"]', // Rating container
        'div[data-value*="rating"]', // Rating data
      ];

      logUtils.log(prefix, emoji, "Waiting for Place page elements to appear");

      // Use waitForFunction to check for multiple conditions at once
      // This is more efficient and robust than checking selectors one by one
      let foundSelector = false;
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
        logUtils.success(
          prefix,
          emoji,
          "Place page element found - page is a single Place page",
        );
        foundSelector = true;
      } catch {
        // Fallback to individual selector checks
        logUtils.warn(
          prefix,
          emoji,
          "waitForFunction failed, trying individual selectors...",
        );
        for (const selector of placePageSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 500 });
            logUtils.success(
              prefix,
              emoji,
              `Place page element found with selector: ${selector}`,
            );
            foundSelector = true;
            break;
          } catch {
            // Continue to next selector
          }
        }
      }

      // If URL contains "/maps/place/" but no specific selector found,
      // wait for DOM to stabilize and check URL again to confirm we're on Place page
      if (!foundSelector) {
        logUtils.warn(
          prefix,
          emoji,
          "No specific Place page selector found, waiting for DOM to stabilize...",
        );

        // Wait for DOM to be stable and ready
        try {
          await page.waitForFunction(
            () => {
              return (
                document.body !== undefined &&
                document.readyState === "complete" &&
                window.location.href.includes("/maps/place/")
              );
            },
            { timeout: 5000 },
          );

          // Double-check URL still contains "/maps/place/"
          const currentURL = page.url();
          if (currentURL.includes("/maps/place/")) {
            logUtils.success(
              prefix,
              emoji,
              "URL confirmed to be Place page, DOM stabilized, considering as single place",
            );
            return true;
          } else {
            logUtils.error(
              prefix,
              emoji,
              "URL changed, not a Place page anymore",
            );
            return false;
          }
        } catch {
          // If waitForFunction fails, check URL directly
          const currentURL = page.url();
          if (currentURL.includes("/maps/place/")) {
            logUtils.success(
              prefix,
              emoji,
              "URL confirmed to be Place page, considering as single place",
            );
            return true;
          } else {
            logUtils.error(prefix, emoji, "Not a Place page");
            return false;
          }
        }
      }

      logUtils.success(prefix, emoji, "Single Place page detected and stable");
      return true; // Redirected to Place page and it's stable
    } catch {
      logUtils.error(prefix, emoji, "Not a single Place page");
      return false;
    }
  }
}

/**
 * Extract Place links from first page of results
 */
export async function extractPlaceLinks(
  page: Page,
  maxResults?: number,
): Promise<string[]> {
  const prefix = "EXTRACT LINKS";
  const emoji = "🔗";

  logUtils.log(prefix, emoji, "Extracting Place links from results page...");

  // Quick check for no results before trying to extract links
  const hasNoResults = await checkForNoResults(page);
  if (hasNoResults) {
    logUtils.warn(prefix, emoji, "No results found - returning empty list");
    return [];
  }

  const links: string[] = [];

  // Selector for Place links in feed
  const linkSelector = 'div[role="feed"] div[jsaction] > a';
  logUtils.log(prefix, emoji, `Using selector: ${linkSelector}`);

  logUtils.log(prefix, emoji, "Finding link elements...");
  const linkElements = await page.$$(linkSelector);
  logUtils.log(prefix, emoji, `Found ${linkElements.length} link elements`);

  // If no link elements found, double-check for no results
  if (linkElements.length === 0) {
    logUtils.warn(prefix, emoji, "No link elements found");
    return [];
  }

  const limit = maxResults ?? linkElements.length;
  logUtils.log(prefix, emoji, `Extracting up to ${limit} links...`);

  for (const element of linkElements) {
    if (maxResults !== undefined && links.length >= maxResults) {
      logUtils.log(prefix, emoji, `Reached maxResults limit (${maxResults})`);
      break;
    }

    if (element === null) {
      continue;
    }

    const href = await element.evaluate((el) => el.getAttribute("href"));
    if (href !== null) {
      // Convert relative links to absolute if necessary
      const fullUrl = href.startsWith("http")
        ? href
        : `https://www.google.com${href}`;
      links.push(fullUrl);
      logUtils.success(
        prefix,
        emoji,
        `Extracted link ${links.length}/${limit}: ${fullUrl}`,
      );
    }
  }

  logUtils.success(
    prefix,
    emoji,
    `Successfully extracted ${links.length} Place links`,
  );
  return links;
}
