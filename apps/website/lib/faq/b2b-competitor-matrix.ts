import { type CompareLevel } from "@/lib/compare/types";

export const B2B_COMPARE_CRITERIA = [
  "visitorGamification",
  "visitStats",
  "visitorPhotos",
  "territoryDashboard",
  "customChallenges",
  "mobileB2cApp",
  "poiCms",
  "openDataSyndication",
] as const;

export type B2bCompareCriterion = (typeof B2B_COMPARE_CRITERIA)[number];

export const B2B_COMPARE_APPS = [
  "vagabondPro",
  "wivisites",
  "cirkwi",
  "totemus",
  "tourinsoft",
  "apidae",
] as const;

export type B2bCompareApp = (typeof B2B_COMPARE_APPS)[number];

export const B2B_COMPARE_MATRIX: Record<
  B2bCompareCriterion,
  Record<B2bCompareApp, CompareLevel>
> = {
  visitorGamification: {
    vagabondPro: "yes",
    wivisites: "no",
    cirkwi: "no",
    totemus: "no",
    tourinsoft: "no",
    apidae: "no",
  },
  visitStats: {
    vagabondPro: "yes",
    wivisites: "no",
    cirkwi: "no",
    totemus: "no",
    tourinsoft: "no",
    apidae: "no",
  },
  visitorPhotos: {
    vagabondPro: "yes",
    wivisites: "no",
    cirkwi: "no",
    totemus: "no",
    tourinsoft: "no",
    apidae: "no",
  },
  territoryDashboard: {
    vagabondPro: "yes",
    wivisites: "no",
    cirkwi: "no",
    totemus: "no",
    tourinsoft: "no",
    apidae: "no",
  },
  customChallenges: {
    vagabondPro: "yes",
    wivisites: "no",
    cirkwi: "no",
    totemus: "no",
    tourinsoft: "no",
    apidae: "no",
  },
  mobileB2cApp: {
    vagabondPro: "yes",
    wivisites: "yes",
    cirkwi: "yes",
    totemus: "yes",
    tourinsoft: "no",
    apidae: "no",
  },
  poiCms: {
    vagabondPro: "no",
    wivisites: "yes",
    cirkwi: "yes",
    totemus: "yes",
    tourinsoft: "yes",
    apidae: "yes",
  },
  openDataSyndication: {
    vagabondPro: "no",
    wivisites: "no",
    cirkwi: "yes",
    totemus: "no",
    tourinsoft: "yes",
    apidae: "yes",
  },
};

export function toCompareAppKey(app: B2bCompareApp): string {
  return `${app.charAt(0).toUpperCase()}${app.slice(1)}`;
}

export function toCompareCriterionKey(criterion: B2bCompareCriterion): string {
  return `${criterion.charAt(0).toUpperCase()}${criterion.slice(1)}`;
}
