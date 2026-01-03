import type { Page } from "puppeteer";

interface WindowWithAppState extends Window {
  APP_INITIALIZATION_STATE?: unknown[];
}

/**
 * Wait for APP_INITIALIZATION_STATE to be available in the DOM
 * This is better than a hard wait as it waits for actual data availability
 */
async function waitForAppState(page: Page, timeout = 1500): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const hasData = await page.evaluate(() => {
        const win = window as WindowWithAppState;
        return (
          typeof window !== "undefined" &&
          win.APP_INITIALIZATION_STATE?.[3] !== undefined
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
 */
export async function extractPlaceData(
  page: Page,
  maxRetries = 30,
): Promise<string | null> {
  let appState: unknown[] | null = null;

  // Retry logic: data may take time to load
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Retrieve the full APP_INITIALIZATION_STATE from the browser
      appState = await page.evaluate(() => {
        const win = window as WindowWithAppState;
        if (
          typeof window !== "undefined" &&
          win.APP_INITIALIZATION_STATE !== undefined
        ) {
          return win.APP_INITIALIZATION_STATE;
        }
        return null;
      });

      if (appState?.[3] !== undefined) {
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

  if (appState?.[3] === undefined) {
    throw new Error("APP_INITIALIZATION_STATE data not found after retries");
  }

  // Extract data in TypeScript code (not in browser)
  const appStateData = appState[3];
  if (
    appStateData === null ||
    appStateData === undefined ||
    typeof appStateData !== "object"
  ) {
    throw new Error("APP_INITIALIZATION_STATE[3] is invalid");
  }

  const keys = Object.keys(appStateData);

  if (keys.length === 0) {
    throw new Error("APP_INITIALIZATION_STATE[3] is empty");
  }

  const key = keys[0];
  if (key === null || key === undefined) {
    throw new Error("No key found in APP_INITIALIZATION_STATE[3]");
  }

  const placeDataEntry = appStateData[key as keyof typeof appStateData];
  if (
    !placeDataEntry ||
    typeof placeDataEntry !== "object" ||
    !Array.isArray(placeDataEntry)
  ) {
    throw new Error(
      `Place data not found at APP_INITIALIZATION_STATE[3][${key}][6]`,
    );
  }

  const placeData = placeDataEntry[6];
  if (placeData === null || placeData === undefined) {
    throw new Error(
      `Place data not found at APP_INITIALIZATION_STATE[3][${key}][6]`,
    );
  }

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
