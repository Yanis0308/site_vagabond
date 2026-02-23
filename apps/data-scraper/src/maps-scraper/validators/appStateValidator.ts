import {
  type AppInitializationState,
  AppInitializationStateSchema,
  type AppStateData,
  AppStateDataSchema,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { logUtils } from "../utils/logging.js";

/**
 * Type guard to check if APP_INITIALIZATION_STATE is valid
 */
export function isValidAppInitializationState(
  value: unknown,
): value is AppInitializationState {
  return validateWithSchema(AppInitializationStateSchema, value);
}

/**
 * Type guard to check if APP_INITIALIZATION_STATE[3] is valid
 */
export function isValidAppStateData(value: unknown): value is AppStateData {
  return validateWithSchema(AppStateDataSchema, value);
}

/**
 * Try to parse stateData if it's a string, or return it as-is if it's already an array
 */
function normalizeStateData(stateData: unknown): unknown {
  // If it's already an array, return as-is
  if (Array.isArray(stateData)) {
    return stateData;
  }

  // If it's an object with an 'hg' property that is an array, extract it
  if (
    typeof stateData === "object" &&
    stateData !== null &&
    "hg" in stateData &&
    Array.isArray((stateData as { hg: unknown }).hg)
  ) {
    logUtils.warn(
      "VALIDATOR",
      "🔧",
      "APP_INITIALIZATION_STATE[3] is an object with 'hg' property, extracting array",
    );
    return (stateData as { hg: unknown[] }).hg;
  }

  // If it's a string, try to parse it as JSON
  if (typeof stateData === "string") {
    try {
      const parsed: unknown = JSON.parse(stateData);
      // If parsed result is an array, return it
      if (Array.isArray(parsed)) {
        logUtils.warn(
          "VALIDATOR",
          "🔧",
          "APP_INITIALIZATION_STATE[3] was a JSON string, parsed successfully",
        );
        return parsed;
      }
      // If parsed result is an object with 'hg' property, extract it
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "hg" in parsed &&
        Array.isArray((parsed as { hg: unknown }).hg)
      ) {
        logUtils.warn(
          "VALIDATOR",
          "🔧",
          "APP_INITIALIZATION_STATE[3] parsed string contains object with 'hg' property",
        );
        return (parsed as { hg: unknown[] }).hg;
      }
      // If parsed result is not an array, return original
      return stateData;
    } catch {
      // If parsing fails, return original
      return stateData;
    }
  }

  // For other types, return as-is
  return stateData;
}

/**
 * Validate and extract place data from APP_INITIALIZATION_STATE
 * Structure: APP_INITIALIZATION_STATE[3][5] or [3][6] contains the JSON string
 */
export function extractValidatedPlaceData(
  appState: unknown,
): { success: true; data: unknown } | { success: false; error: string } {
  // Validate root structure
  if (!isValidAppInitializationState(appState)) {
    return {
      success: false,
      error: "Invalid APP_INITIALIZATION_STATE structure",
    };
  }

  // Extract [3]
  const stateData = appState[3];
  if (stateData === undefined) {
    return {
      success: false,
      error: "APP_INITIALIZATION_STATE[3] is missing",
    };
  }

  // Try to normalize stateData (parse if it's a string)
  const normalizedStateData = normalizeStateData(stateData);

  // Validate [3] structure (should be an array of 7+ elements)
  if (!isValidAppStateData(normalizedStateData)) {
    // Fallback: if stateData is a string, try to use it directly as place data
    if (typeof normalizedStateData === "string") {
      logUtils.warn(
        "VALIDATOR",
        "⚠️",
        "APP_INITIALIZATION_STATE[3] is a string, using it directly as place data",
      );
      return {
        success: true,
        data: normalizedStateData,
      };
    }

    // Log detailed error information for debugging
    const stateDataType = Array.isArray(normalizedStateData)
      ? `array[${normalizedStateData.length}]`
      : typeof normalizedStateData;
    const stateDataPreview =
      typeof normalizedStateData === "string"
        ? normalizedStateData.substring(0, 200) + "..."
        : JSON.stringify(normalizedStateData).substring(0, 200) + "...";

    logUtils.error(
      "VALIDATOR",
      "❌",
      `Invalid APP_INITIALIZATION_STATE[3] structure. Type: ${stateDataType}, Preview: ${stateDataPreview}`,
    );

    return {
      success: false,
      error: `Invalid APP_INITIALIZATION_STATE[3] structure - expected array with at least 7 elements, got ${stateDataType}`,
    };
  }

  // Try to find place data in [6] first (most common), then [5]
  // These elements typically contain JSON strings with place data
  const placeData = normalizedStateData[6] ?? normalizedStateData[5];

  if (placeData === null || placeData === undefined) {
    return {
      success: false,
      error: "Place data not found at APP_INITIALIZATION_STATE[3][6] or [3][5]",
    };
  }

  return {
    success: true,
    data: placeData,
  };
}
