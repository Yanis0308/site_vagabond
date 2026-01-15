import type { Page } from "puppeteer";

import {
  extractValidatedPlaceData,
  validateAppInitializationState,
} from "../validators/appStateValidator.js";

interface WindowWithAppState extends Window {
  APP_INITIALIZATION_STATE?: unknown;
}

/**
 * Wait for APP_INITIALIZATION_STATE to be available in the DOM
 * This is better than a hard wait as it waits for actual data availability
 * Uses the validator to check if the state is valid
 */
async function waitForAppState(page: Page, timeout = 1500): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const hasData = await page.evaluate(() => {
        // Type assertion needed to access custom window property in browser context
        const win = window as WindowWithAppState;
        if (
          typeof window !== "undefined" &&
          win.APP_INITIALIZATION_STATE === undefined
        ) {
          return false;
        }
        // Basic check: is it an array with at least 4 elements?
        const state = win.APP_INITIALIZATION_STATE;
        return (
          Array.isArray(state) && state.length >= 4 && state[3] !== undefined
        );
      });
      if (hasData) {
        return; // Data is available, no need to wait
      }
    } catch {
      // Continue waiting
    }
    // Small delay before checking again (50ms intervals)
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Extract place data from APP_INITIALIZATION_STATE
 * Retrieves the full APP_INITIALIZATION_STATE from the browser and extracts data in TypeScript
 * Uses generateValidator to validate the structure instead of manual if checks
 */
export async function extractPlaceData(
  page: Page,
  maxRetries = 30,
): Promise<string | null> {
  let appState: unknown = null;

  // Retry logic: data may take time to load
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Retrieve the full APP_INITIALIZATION_STATE from the browser
      appState = await page.evaluate(() => {
        // Type assertion needed to access custom window property in browser context
        const win = window as WindowWithAppState;
        if (
          typeof window !== "undefined" &&
          win.APP_INITIALIZATION_STATE !== undefined
        ) {
          return win.APP_INITIALIZATION_STATE;
        }
        return null;
      });

      // Use validator instead of manual check
      if (validateAppInitializationState(appState)) {
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to extract data after ${maxRetries} attempts: ${errorMessage}`,
        );
      }
    }

    // Wait for APP_INITIALIZATION_STATE to be available instead of hard wait
    await waitForAppState(page, 5000);
  }

  // Validate and extract place data using TypeBox validation
  const result = extractValidatedPlaceData(appState);

  if (!result.success) {
    // Log the full appState structure for debugging (truncated)
    const appStatePreview = JSON.stringify(appState).substring(0, 500);
    const errorMessage = `${result.error}. AppState preview: ${appStatePreview}...`;
    throw new Error(errorMessage);
  }

  const placeData = result.data;

  // Convert to string if necessary
  const jsonString =
    typeof placeData === "string" ? placeData : JSON.stringify(placeData);

  // Remove security prefix if present
  const prefix = `)]}'`;
  const cleaned = jsonString.trim().startsWith(prefix)
    ? jsonString.trim().substring(prefix.length).trim()
    : jsonString.trim();

  return cleaned;
}
