import type { PoiEnrichedData } from "@vagabond/shared-utils";

import { type PoiType } from "@/utils/types";

export type ListItemType =
  | { type: "header"; data: PoiType }
  | { type: "titleAndButton"; data: PoiType; isVisited: boolean }
  | { type: "rating"; rating: number; count: number }
  | { type: "reviews" }
  | { type: "photos" }
  | { type: "description"; text?: string }
  | { type: "categories" }
  | { type: "contactInfo" }
  | { type: "price" }
  | { type: "averageVisitDuration" }
  | { type: "badges" }
  | { type: "accessibility" }
  | { type: "transportAccess" }
  | { type: "amenities" }
  | { type: "practicalTips" }
  | { type: "funFacts" }
  | { type: "seasonalClosure" }
  | { type: "socialMedia" }
  | {
      type: "userFeedback";
      placeId: string;
    }
  | { type: "admin"; placeId: string; placeName: string }
  | { type: "loading" };

interface BuildListDataParams {
  place: PoiType | null;
  enrichedData: PoiEnrichedData | undefined;
  isVisited: boolean;
  rating: number;
  ratingCount: number;
  userRole: string | undefined;
  isLoadingEnriched: boolean;
}

export const buildListData = ({
  place,
  enrichedData,
  isVisited,
  rating,
  ratingCount,
  userRole,
  isLoadingEnriched,
}: BuildListDataParams): ListItemType[] => {
  if (place === null) return [];

  const items: ListItemType[] = [
    { type: "header", data: place },
    { type: "titleAndButton", data: place, isVisited },
  ];

  if (rating > 0 || ratingCount > 0) {
    items.push({ type: "rating", rating, count: ratingCount });
  }

  items.push({ type: "reviews" });

  // Show loading indicator while fetching enriched data
  if (isLoadingEnriched) {
    items.push({ type: "loading" });
  }

  if (enrichedData?.photos !== undefined && enrichedData.photos.length > 0) {
    items.push({ type: "photos" });
  }

  if (
    enrichedData?.funFacts !== undefined &&
    enrichedData.funFacts.length > 0
  ) {
    items.push({ type: "funFacts" });
  }

  const descriptionText = enrichedData?.description;
  if (descriptionText !== undefined && descriptionText !== "") {
    items.push({ type: "description", text: descriptionText });
  }

  // if (
  //   enrichedData?.categories !== undefined &&
  //   enrichedData.categories.length > 0
  // ) {
  //   items.push({ type: "categories" });
  // }

  // Contact info (address, phone, website, openingHours, price) grouped together
  const hasPrice =
    enrichedData?.price?.adult !== undefined ||
    enrichedData?.price?.child !== undefined ||
    enrichedData?.price?.notes !== undefined;

  if (
    enrichedData?.address !== undefined ||
    (enrichedData?.phone !== undefined && enrichedData.phone !== "") ||
    (enrichedData?.website !== undefined && enrichedData.website !== "") ||
    (enrichedData?.openingHours !== undefined &&
      enrichedData.openingHours.length > 0) ||
    hasPrice
  ) {
    items.push({ type: "contactInfo" });
  }

  if (enrichedData?.averageVisitDuration !== undefined) {
    items.push({ type: "averageVisitDuration" });
  }

  // Badges section (instagram, family friendly, location type, tourist interest, reservation)
  const hasBadges =
    (enrichedData?.instagrammable !== undefined &&
      enrichedData.instagrammable) ||
    (enrichedData?.familyFriendly !== undefined &&
      enrichedData.familyFriendly) ||
    enrichedData?.locationType !== undefined ||
    enrichedData?.touristInterest !== undefined ||
    enrichedData?.reservationRequired !== undefined;

  if (hasBadges) {
    items.push({ type: "badges" });
  }

  if (enrichedData?.amenities !== undefined) {
    items.push({ type: "amenities" });
  }

  // Collapsible sections in order: practicalTips, transportAccess, accessibility
  if (
    enrichedData?.practicalTips !== undefined &&
    enrichedData.practicalTips.length > 0
  ) {
    items.push({ type: "practicalTips" });
  }

  if (enrichedData?.transportAccess !== undefined) {
    items.push({ type: "transportAccess" });
  }

  if (enrichedData?.accessibility !== undefined) {
    items.push({ type: "accessibility" });
  }

  if (
    enrichedData?.seasonalClosure !== undefined &&
    enrichedData.seasonalClosure.length > 0
  ) {
    items.push({ type: "seasonalClosure" });
  }

  if (enrichedData?.socialMedia !== undefined) {
    items.push({ type: "socialMedia" });
  }

  items.push({
    type: "userFeedback",
    placeId: place.id,
  });

  if (userRole === "ADMIN") {
    items.push({
      type: "admin",
      placeId: place.id,
      placeName: place.name,
    });
  }

  return items;
};
