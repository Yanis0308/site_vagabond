import { type CompareLevel } from "@/lib/compare/types";

export type { CompareLevel };

export const B2C_COMPARE_CRITERIA = [
  "france",
  "scratchMap",
  "pois",
  "gamification",
  "gpsValidation",
  "travelJournal",
  "freeNoAds",
  "rankings",
] as const;

export type B2cCompareCriterion = (typeof B2C_COMPARE_CRITERIA)[number];

export const B2C_COMPARE_APPS = [
  "vagabond",
  "geocaching",
  "polarsteps",
  "been",
  "visited",
  "googleMaps",
  "tripadvisor",
  "pokemonGo",
  "wivisites",
] as const;

export type B2cCompareApp = (typeof B2C_COMPARE_APPS)[number];

export const B2C_COMPARE_MATRIX: Record<
  B2cCompareCriterion,
  Record<B2cCompareApp, CompareLevel>
> = {
  france: {
    vagabond: "yes",
    geocaching: "no",
    polarsteps: "no",
    been: "no",
    visited: "no",
    googleMaps: "no",
    tripadvisor: "no",
    pokemonGo: "no",
    wivisites: "yes",
  },
  scratchMap: {
    vagabond: "yes",
    geocaching: "no",
    polarsteps: "no",
    been: "no",
    visited: "no",
    googleMaps: "no",
    tripadvisor: "no",
    pokemonGo: "no",
    wivisites: "no",
  },
  pois: {
    vagabond: "yes",
    geocaching: "no",
    polarsteps: "no",
    been: "no",
    visited: "no",
    googleMaps: "no",
    tripadvisor: "no",
    pokemonGo: "no",
    wivisites: "yes",
  },
  gamification: {
    vagabond: "yes",
    geocaching: "yes",
    polarsteps: "no",
    been: "no",
    visited: "no",
    googleMaps: "no",
    tripadvisor: "no",
    pokemonGo: "yes",
    wivisites: "no",
  },
  gpsValidation: {
    vagabond: "yes",
    geocaching: "yes",
    polarsteps: "no",
    been: "no",
    visited: "no",
    googleMaps: "no",
    tripadvisor: "no",
    pokemonGo: "yes",
    wivisites: "no",
  },
  travelJournal: {
    vagabond: "yes",
    geocaching: "no",
    polarsteps: "yes",
    been: "no",
    visited: "no",
    googleMaps: "no",
    tripadvisor: "no",
    pokemonGo: "no",
    wivisites: "no",
  },
  freeNoAds: {
    vagabond: "yes",
    geocaching: "no",
    polarsteps: "no",
    been: "no",
    visited: "no",
    googleMaps: "yes",
    tripadvisor: "yes",
    pokemonGo: "no",
    wivisites: "no",
  },
  rankings: {
    vagabond: "yes",
    geocaching: "yes",
    polarsteps: "no",
    been: "no",
    visited: "no",
    googleMaps: "no",
    tripadvisor: "no",
    pokemonGo: "yes",
    wivisites: "no",
  },
};

export function toCompareAppKey(app: B2cCompareApp): string {
  return `${app.charAt(0).toUpperCase()}${app.slice(1)}`;
}

export function toCompareCriterionKey(criterion: B2cCompareCriterion): string {
  return `${criterion.charAt(0).toUpperCase()}${criterion.slice(1)}`;
}
