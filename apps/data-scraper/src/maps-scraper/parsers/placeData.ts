import type { AboutItem, LinkSource, PlaceEntry } from "../types/PlaceEntry.js";
import { extractActualURL, getNthElement } from "../utils/jsonParser.js";
import { parseReviews } from "./reviews.js";

/**
 * Extract hours from darray
 */
export function getHours(darray: unknown[]): Record<string, string[]> {
  // Try new structure first (Nov 2025)
  let items = getNthElement(darray, [203, 0], []);
  if (!Array.isArray(items) || items.length === 0) {
    // Fallback to old structure
    items = getNthElement(darray, [34, 1], []);
  }

  const hours: Record<string, string[]> = {};

  for (const item of items as unknown[]) {
    if (!Array.isArray(item)) continue;

    const day = getNthElement(item, 0, "");
    if (day === null) continue;

    // Try new structure for hours
    const timeSlotsI = getNthElement(item, 3, []);
    if (Array.isArray(timeSlotsI) && timeSlotsI.length > 0) {
      // New format: each slot contains [formatted_string, ...]
      const times: string[] = [];
      for (const slot of timeSlotsI) {
        if (!Array.isArray(slot) || slot.length === 0) continue;
        const timeStr = getNthElement(slot, 0, "");
        if (timeStr !== null) {
          times.push(timeStr as string);
        }
      }
      if (times.length > 0) {
        hours[day as string] = times;
      }
    } else {
      // Old format: [1] contains hours directly
      const timesI = getNthElement(item, 1, []);
      if (Array.isArray(timesI)) {
        const times = timesI.map((t) => String(t)).filter((t) => t !== null);
        if (times.length > 0) {
          hours[day as string] = times;
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
  const items = getNthElement(darray, [84, 0], []);
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

    const day = Math.floor(getNthElement(item, 0, 0) as number);
    const timesI = getNthElement(item, 1, []);

    if (!Array.isArray(timesI)) continue;

    const times: Record<number, number> = {};
    for (const t of timesI) {
      if (!Array.isArray(t) || t.length < 2) continue;
      const hour = Math.floor(Number(t[0]) ?? 0);
      const value = Math.floor(Number(t[1]) ?? 0);
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

    const link = getNthElement(item, linkPath, "");
    const source = getNthElement(item, sourcePath, "");

    if (link !== null && source !== null) {
      result.push({ link: link as string, source: source as string });
    }
  }

  return result;
}

/**
 * Parse place data from raw JSON string
 */
export function parsePlaceData(rawJson: string): PlaceEntry {
  const data = JSON.parse(rawJson) as unknown[];

  if (!Array.isArray(data) || data.length < 7) {
    throw new Error("Invalid JSON structure");
  }

  const darray = data[6]; // Index 6 contains main data
  if (!Array.isArray(darray)) {
    throw new Error("Invalid darray structure");
  }

  const entry: PlaceEntry = {};

  // Extract base fields
  entry.reviewCount = Math.floor(getNthElement(darray, [4, 8], 0) as number);
  entry.link = getNthElement(darray, 27, "") as string;
  entry.title = getNthElement(darray, 11, "") as string;

  // Categories
  const categoriesI = getNthElement(darray, 13, []);
  entry.categories = Array.isArray(categoriesI)
    ? categoriesI.map((c) => String(c))
    : [];
  entry.category = entry.categories[0] ?? "";

  // Address
  const fullAddress = getNthElement(darray, 18, "");
  entry.address = String(fullAddress).replace(`${entry.title},`, "").trim();

  // Opening hours
  entry.openHours = getHours(darray);

  // Popular times
  entry.popularTimes = getPopularTimes(darray);

  // Website (may be encoded in Google URL)
  const websiteRaw = getNthElement(darray, [7, 0], "");
  entry.website = extractActualURL(websiteRaw as string);

  // Phone
  entry.phone = (getNthElement(darray, [178, 0, 0], "") as string).replace(
    /\s/g,
    "",
  );

  // Plus Code
  entry.plusCode = getNthElement(darray, [183, 2, 2, 0], "") as string;

  // Average rating
  entry.reviewRating = getNthElement(darray, [4, 7], 0) as number;

  // Coordinates
  entry.latitude = getNthElement(darray, [9, 2], 0) as number;
  entry.longitude = getNthElement(darray, [9, 3], 0) as number;

  // CID (Customer ID)
  entry.cid = getNthElement(data, [25, 3, 0, 13, 0, 0, 1], "") as string;

  // Status
  entry.status = getNthElement(darray, [34, 4, 4], "") as string;

  // Description
  entry.description = getNthElement(darray, [32, 1, 1], "") as string;

  // Reviews link
  entry.reviewsLink = getNthElement(darray, [4, 3, 0], "") as string;

  // Thumbnail
  entry.thumbnail = getNthElement(darray, [72, 0, 1, 6, 0], "") as string;

  // Timezone
  entry.timezone = getNthElement(darray, 30, "") as string;

  // Price range
  entry.priceRange = getNthElement(darray, [4, 2], "") as string;

  // Data ID
  entry.dataId = getNthElement(darray, 10, "") as string;

  // Images
  const imagesI = getNthElement(darray, [171, 0], []);
  entry.images = getLinkSource(imagesI as unknown[], [3, 0, 6, 0], [2]).map(
    (item) => ({
      title: item.source,
      image: item.link,
    }),
  );

  // Reservations
  entry.reservations = getLinkSource(
    getNthElement(darray, 46, []) as unknown[],
    [0],
    [1],
  );

  // Order online
  let orderOnlineI = getNthElement(darray, [75, 0, 1, 2], []);
  if (!Array.isArray(orderOnlineI) || orderOnlineI.length === 0) {
    orderOnlineI = getNthElement(darray, [75, 0, 0, 2], []);
  }
  entry.orderOnline = getLinkSource(
    orderOnlineI as unknown[],
    [1, 2, 0],
    [0, 0],
  );

  // Menu
  const menuLink = getNthElement(darray, [38, 0], "");
  const menuSource = getNthElement(darray, [38, 1], "");
  if (menuLink !== null && menuSource !== null) {
    entry.menu = { link: menuLink as string, source: menuSource as string };
  }

  // Owner
  const ownerId = getNthElement(darray, [57, 2], "");
  const ownerName = getNthElement(darray, [57, 1], "");
  if (ownerId !== null && ownerName !== null) {
    entry.owner = {
      id: ownerId as string,
      name: ownerName as string,
      link:
        ownerId !== null
          ? `https://www.google.com/maps/contrib/${ownerId as string}`
          : "",
    };
  }

  // Complete address
  entry.completeAddress = {
    borough: getNthElement(darray, [183, 1, 0], "") as string,
    street: getNthElement(darray, [183, 1, 1], "") as string,
    city: getNthElement(darray, [183, 1, 3], "") as string,
    postalCode: getNthElement(darray, [183, 1, 4], "") as string,
    state: getNthElement(darray, [183, 1, 5], "") as string,
    country: getNthElement(darray, [183, 1, 6], "") as string,
  };

  // About section
  const aboutI = getNthElement(darray, [100, 1], []);
  entry.about = [];
  if (Array.isArray(aboutI)) {
    for (const item of aboutI) {
      if (!Array.isArray(item)) continue;
      const id = getNthElement(item, 0, "");
      const name = getNthElement(item, 1, "");

      if (id === null || name === null) continue;

      const aboutItem: AboutItem = {
        id: id as string,
        name: name as string,
        options: [],
      };

      const optsI = getNthElement(item, 2, []);
      if (Array.isArray(optsI)) {
        for (const opt of optsI) {
          if (!Array.isArray(opt)) continue;
          const optName = getNthElement(opt, [1], "");
          const optEnabled = getNthElement(opt, [2, 1, 0, 0], 0) === 1;
          if (optName !== null) {
            aboutItem.options.push({
              name: optName as string,
              enabled: optEnabled,
            });
          }
        }
      }

      entry.about.push(aboutItem);
    }
  }

  // Reviews per rating
  entry.reviewsPerRating = {
    1: Math.floor(getNthElement(darray, [175, 3, 0], 0) as number),
    2: Math.floor(getNthElement(darray, [175, 3, 1], 0) as number),
    3: Math.floor(getNthElement(darray, [175, 3, 2], 0) as number),
    4: Math.floor(getNthElement(darray, [175, 3, 3], 0) as number),
    5: Math.floor(getNthElement(darray, [175, 3, 4], 0) as number),
  };

  // User reviews (first reviews)
  const reviewsI = getNthElement(darray, [175, 9, 0, 0], []);
  entry.userReviews = parseReviews(reviewsI as unknown[]);

  return entry;
}
