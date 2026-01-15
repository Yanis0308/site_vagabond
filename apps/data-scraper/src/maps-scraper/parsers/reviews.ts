import type { Review } from "@vagabond/shared-utils";

import {
  decodeURL,
  getNthArray,
  getNthNumber,
  getNthString,
} from "../utils/jsonParser.js";

/**
 * Parse reviews from JSON structure
 */
export function parseReviews(reviewsI: unknown[]): Review[] {
  const reviews: Review[] = [];

  if (!Array.isArray(reviewsI)) return reviews;

  for (const reviewItem of reviewsI) {
    if (!Array.isArray(reviewItem)) continue;

    const el = getNthArray(reviewItem, 0, []);
    if (!Array.isArray(el)) continue;

    const time = getNthArray(el, [2, 2, 0, 1, 21, 6, 8], []);

    let profilePic = getNthString(el, [1, 4, 5, 1], "");
    try {
      profilePic = decodeURL(profilePic);
    } catch {
      profilePic = "";
    }

    const name = getNthString(el, [1, 4, 5, 0], "");
    if (name === "") continue;

    const when =
      Array.isArray(time) && time.length >= 3
        ? `${String(time[0])}-${String(time[1])}-${String(time[2])}`
        : "";

    const review: Review = {
      name,
      profilePicture: profilePic,
      when,
      rating: Math.floor(getNthNumber(el, [2, 0, 0], 0)),
      description: getNthString(el, [2, 15, 0, 0], ""),
      images: [],
    };

    const optsI = getNthArray(el, [2, 2, 0, 1, 21, 7], []);
    if (Array.isArray(optsI)) {
      for (const opt of optsI) {
        if (typeof opt === "string" && opt.length > 2) {
          review.images.push(opt.substring(2));
        }
      }
    }

    reviews.push(review);
  }

  return reviews;
}
