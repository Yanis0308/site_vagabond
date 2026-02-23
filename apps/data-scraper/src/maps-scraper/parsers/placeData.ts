import {
  type AboutItem,
  type GoogleMapsPlaceStrict,
  GoogleMapsPlaceStrictSchema,
  type LinkSource,
  validateWithSchema,
} from "@vagabond/shared-utils";

import {
  extractActualURL,
  getNthArray,
  getNthNumber,
  getNthString,
} from "../utils/jsonParser.js";
import { logUtils } from "../utils/logging.js";
import { parseReviews } from "./reviews.js";

/**
 * Extract hours from darray
 */
export function getHours(darray: unknown[]): Record<string, string[]> {
  // Try new structure first (Nov 2025)
  let items = getNthArray(darray, [203, 0], []);
  if (!Array.isArray(items) || items.length === 0) {
    // Fallback to old structure
    items = getNthArray(darray, [34, 1], []);
  }

  // Map French day names to English (normalize for API compatibility)
  const dayMapping: Record<string, string> = {
    lundi: "Monday",
    mardi: "Tuesday",
    mercredi: "Wednesday",
    jeudi: "Thursday",
    vendredi: "Friday",
    samedi: "Saturday",
    dimanche: "Sunday",
  };

  const hours: Record<string, string[]> = {};

  for (const item of items) {
    if (!Array.isArray(item)) continue;

    const dayRaw = getNthString(item, 0, "");
    if (dayRaw === "") continue;

    // Normalize day name to English
    const day = dayMapping[dayRaw.toLowerCase()] ?? dayRaw;

    // Try new structure for hours
    const timeSlotsI = getNthArray(item, 3, []);
    if (Array.isArray(timeSlotsI) && timeSlotsI.length > 0) {
      // New format: each slot contains [formatted_string, ...]
      const times: string[] = [];
      for (const slot of timeSlotsI) {
        if (!Array.isArray(slot) || slot.length === 0) continue;
        const timeStr = getNthString(slot, 0, "");
        if (timeStr !== "") {
          times.push(timeStr);
        }
      }
      if (times.length > 0) {
        hours[day] = times;
      }
    } else {
      // Old format: [1] contains hours directly
      const timesI = getNthArray(item, 1, []);
      if (Array.isArray(timesI)) {
        const times = timesI.map((t) => String(t)).filter((t) => t !== "");
        if (times.length > 0) {
          hours[day] = times;
        }
      }
    }
  }

  return hours;
}

/**
 * Extract popular times from darray
 */
export function getPopularTimes(
  darray: unknown[],
): Record<string, Record<number, number>> {
  const items = getNthArray(darray, [84, 0], []);
  const popularTimes: Record<string, Record<number, number>> = {};

  const dayOfWeek: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
  };

  if (!Array.isArray(items)) {
    return popularTimes;
  }

  for (const item of items) {
    if (!Array.isArray(item)) continue;

    const day = Math.floor(getNthNumber(item, 0, 0));
    const timesI = getNthArray(item, 1, []);

    if (!Array.isArray(timesI)) continue;

    const times: Record<number, number> = {};
    for (const t of timesI) {
      if (!Array.isArray(t) || t.length < 2) continue;
      const hour = Math.floor(Number(t[0]));
      const value = Math.floor(Number(t[1]));
      times[hour] = value;
    }

    if (dayOfWeek[day] !== undefined) {
      popularTimes[dayOfWeek[day]] = times;
    }
  }

  return popularTimes;
}

/**
 * Extract link and source pairs from array
 */
export function getLinkSource(
  arr: unknown[],
  linkPath: number[],
  sourcePath: number[],
): LinkSource[] {
  const result: LinkSource[] = [];

  if (!Array.isArray(arr)) return result;

  for (const item of arr) {
    if (!Array.isArray(item)) continue;

    const link = getNthString(item, linkPath, "");
    const source = getNthString(item, sourcePath, "");

    if (link !== "" && source !== "") {
      result.push({ link, source });
    }
  }

  return result;
}

/**
 * Parse place data from raw JSON string (internal - no validation)
 */
function parsePlaceDataInternal(rawJson: string): GoogleMapsPlaceStrict {
  const data = JSON.parse(rawJson) as unknown;

  if (!Array.isArray(data) || data.length < 7) {
    throw new Error("Invalid JSON structure");
  }

  const darray = getNthArray(data, 6, []); // Index 6 contains main data
  if (!Array.isArray(darray)) {
    throw new Error("Invalid darray structure");
  }

  const entry: Partial<GoogleMapsPlaceStrict> = {};

  // Extract base fields
  entry.reviewCount = Math.floor(getNthNumber(darray, [4, 8], 0));
  entry.link = getNthString(darray, 27, "");
  entry.title = getNthString(darray, 11, "");

  // Categories
  const categoriesI = getNthArray(darray, 13, []);
  entry.categories = Array.isArray(categoriesI)
    ? categoriesI.map((c) => String(c))
    : [];
  entry.category = entry.categories[0] ?? "";

  // Address
  const fullAddress = getNthString(darray, 18, "");
  entry.address = fullAddress.replace(`${entry.title},`, "").trim();

  // Opening hours
  entry.openHours = getHours(darray);

  // Popular times
  entry.popularTimes = getPopularTimes(darray);

  // Website (may be encoded in Google URL)
  const websiteRaw = getNthString(darray, [7, 0], "");
  entry.website = extractActualURL(websiteRaw);

  // Phone
  entry.phone = getNthString(darray, [178, 0, 0], "").replace(/\s/g, "");

  // Plus Code
  entry.plusCode = getNthString(darray, [183, 2, 2, 0], "");

  // Average rating
  entry.reviewRating = getNthNumber(darray, [4, 7], 0);

  // Coordinates
  entry.latitude = getNthNumber(darray, [9, 2], 0);
  entry.longitude = getNthNumber(darray, [9, 3], 0);

  // CID (Customer ID)
  entry.cid = getNthString(data, [25, 3, 0, 13, 0, 0, 1], "");

  // Status
  entry.status = getNthString(darray, [34, 4, 4], "");

  // Description
  entry.description = getNthString(darray, [32, 1, 1], "");

  // Reviews link
  entry.reviewsLink = getNthString(darray, [4, 3, 0], "");

  // Thumbnail
  entry.thumbnail = getNthString(darray, [72, 0, 1, 6, 0], "");

  // Timezone
  entry.timezone = getNthString(darray, 30, "");

  // Price range
  entry.priceRange = getNthString(darray, [4, 2], "");

  // Data ID
  entry.dataId = getNthString(darray, 10, "");

  // Images
  const imagesI = getNthArray(darray, [171, 0], []);
  entry.images = getLinkSource(imagesI, [3, 0, 6, 0], [2]).map((item) => ({
    title: item.source,
    image: item.link,
  }));

  // Reservations
  entry.reservations = getLinkSource(getNthArray(darray, 46, []), [0], [1]);

  // Order online
  let orderOnlineI = getNthArray(darray, [75, 0, 1, 2], []);
  if (!Array.isArray(orderOnlineI) || orderOnlineI.length === 0) {
    orderOnlineI = getNthArray(darray, [75, 0, 0, 2], []);
  }
  entry.orderOnline = getLinkSource(orderOnlineI, [1, 2, 0], [0, 0]);

  // Menu
  const menuLink = getNthString(darray, [38, 0], "");
  const menuSource = getNthString(darray, [38, 1], "");
  if (menuLink !== "" && menuSource !== "") {
    entry.menu = { link: menuLink, source: menuSource };
  }

  // Owner
  const ownerId = getNthString(darray, [57, 2], "");
  const ownerName = getNthString(darray, [57, 1], "");
  if (ownerId !== "" && ownerName !== "") {
    entry.owner = {
      id: ownerId,
      name: ownerName,
      link:
        ownerId !== "" ? `https://www.google.com/maps/contrib/${ownerId}` : "",
    };
  }

  // Complete address
  entry.completeAddress = {
    borough: getNthString(darray, [183, 1, 0], ""),
    street: getNthString(darray, [183, 1, 1], ""),
    city: getNthString(darray, [183, 1, 3], ""),
    postalCode: getNthString(darray, [183, 1, 4], ""),
    state: getNthString(darray, [183, 1, 5], ""),
    country: getNthString(darray, [183, 1, 6], ""),
  };

  // About section
  const aboutI = getNthArray(darray, [100, 1], []);
  entry.about = [];
  if (Array.isArray(aboutI)) {
    for (const item of aboutI) {
      if (!Array.isArray(item)) continue;
      const id = getNthString(item, 0, "");
      const name = getNthString(item, 1, "");

      if (id === "" || name === "") continue;

      const aboutItem: AboutItem = {
        id,
        name,
        options: [],
      };

      const optsI = getNthArray(item, 2, []);
      if (Array.isArray(optsI)) {
        for (const opt of optsI) {
          if (!Array.isArray(opt)) continue;
          const optName = getNthString(opt, [1], "");
          const optEnabled = getNthNumber(opt, [2, 1, 0, 0], 0) === 1;
          if (optName !== "") {
            aboutItem.options.push({
              name: optName,
              enabled: optEnabled,
            });
          }
        }
      }

      entry.about.push(aboutItem);
    }
  }

  // Reviews per rating (use string keys to match schema)
  entry.reviewsPerRating = {
    "1": Math.floor(getNthNumber(darray, [175, 3, 0], 0)),
    "2": Math.floor(getNthNumber(darray, [175, 3, 1], 0)),
    "3": Math.floor(getNthNumber(darray, [175, 3, 2], 0)),
    "4": Math.floor(getNthNumber(darray, [175, 3, 3], 0)),
    "5": Math.floor(getNthNumber(darray, [175, 3, 4], 0)),
  };

  // User reviews (first reviews)
  const reviewsI = getNthArray(darray, [175, 9, 0, 0], []);
  entry.userReviews = parseReviews(reviewsI);

  return entry as GoogleMapsPlaceStrict;
}

/**
 * Parse and validate place data from raw JSON string
 * Returns null if validation fails (place will be rejected)
 */
export function parsePlaceData(rawJson: string): GoogleMapsPlaceStrict | null {
  const prefix = "VALIDATE";
  const emoji = "🔍";

  try {
    const entry = parsePlaceDataInternal(rawJson);
    const title = entry.title; // Capture title for logging before validation

    // Additional validation: at least one identifier (cid or dataId) must be present
    if (entry.cid === undefined || entry.dataId === undefined) {
      logUtils.warn(
        prefix,
        emoji,
        `Place "${title}" rejected: missing both cid and dataId`,
      );
      return null;
    }

    // Validate against strict schema
    if (!validateWithSchema(GoogleMapsPlaceStrictSchema, entry)) {
      logUtils.warn(
        prefix,
        emoji,
        `Place "${title}" rejected: schema validation failed`,
      );
      return null;
    }

    return entry;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logUtils.warn(prefix, emoji, `Place parsing failed: ${errorMessage}`);
    return null;
  }
}
