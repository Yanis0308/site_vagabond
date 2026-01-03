import type { Review } from "../types/PlaceEntry.js";
import { decodeURL, getNthElement } from "../utils/jsonParser.js";

/**
 * Parse reviews from JSON structure
 */
export function parseReviews(reviewsI: unknown[]): Review[] {
  const reviews: Review[] = [];

  if (!Array.isArray(reviewsI)) return reviews;

  for (const reviewItem of reviewsI) {
    if (!Array.isArray(reviewItem)) continue;

    const el = getNthElement(reviewItem, 0, []);
    if (!Array.isArray(el)) continue;

    const time = getNthElement(el, [2, 2, 0, 1, 21, 6, 8], []);

    let profilePic = getNthElement(el, [1, 4, 5, 1], "");
    try {
      profilePic = decodeURL(profilePic as string);
    } catch {
      profilePic = "";
    }

    const name = getNthElement(el, [1, 4, 5, 0], "") as string;
    if (name === null) continue;

    const when =
      Array.isArray(time) && time.length >= 3
        ? `${time[0]}-${time[1]}-${time[2]}`
        : "";

    const review: Review = {
      name,
      profilePicture: profilePic as string,
      when,
      rating: Math.floor(getNthElement(el, [2, 0, 0], 0) as number),
      description: getNthElement(el, [2, 15, 0, 0], "") as string,
      images: [],
    };

    const optsI = getNthElement(el, [2, 2, 0, 1, 21, 7], []);
    if (Array.isArray(optsI)) {
      for (const opt of optsI) {
        const val = String(opt ?? "");
        if (val !== null && val.length > 2) {
          review.images.push(val.substring(2));
        }
      }
    }

    reviews.push(review);
  }

  return reviews;
}
