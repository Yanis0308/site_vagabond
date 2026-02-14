import { type schema } from "@vagabond/database-client";

type BoundaryLevelEnum = (typeof schema.boundaryLevelEnum.enumValues)[number];

/**
 * Configuration for mapping OpenStreetMap admin_level values to BoundaryLevelEnum
 * by country. This allows for different administrative structures per country.
 */
export interface CountryBoundaryMapping {
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** Country name for display purposes */
  countryName: string;
  /** Mapping from OSM admin_level number to our BoundaryLevelEnum */
  adminLevelMapping: Record<number, BoundaryLevelEnum>;
}

/**
 * Default boundary mappings for different countries
 */
export const COUNTRY_BOUNDARY_MAPPINGS: Record<string, CountryBoundaryMapping> =
  {
    // France - current mapping
    FR: {
      countryCode: "FR",
      countryName: "France",
      adminLevelMapping: {
        2: "COUNTRY", // Pays
        4: "REGION", // Région
        6: "COUNTY", // Département
        8: "CITY", // Commune
        9: "DISTRICT", // Arrondissement municipal
        10: "NEIGHBORHOOD", // Quartier
      },
    },

    // Default/fallback mapping - uses current logic
    DEFAULT: {
      countryCode: "DEFAULT",
      countryName: "Default",
      adminLevelMapping: {
        2: "COUNTRY",
        4: "REGION",
        6: "COUNTY",
        8: "CITY",
        9: "DISTRICT",
        10: "NEIGHBORHOOD",
      },
    },
  };

/**
 * Get the boundary level enum for a given admin_level and country
 * @param adminLevelNumber The OSM admin_level number
 * @param countryCode The ISO country code (defaults to "DEFAULT")
 * @returns The corresponding BoundaryLevelEnum or null if not mapped
 */
export function getBoundaryLevel(
  adminLevelNumber: number,
  countryCode = "DEFAULT",
): BoundaryLevelEnum | null {
  // Get the mapping for the specific country, fallback to DEFAULT
  const mapping =
    COUNTRY_BOUNDARY_MAPPINGS[countryCode] ?? COUNTRY_BOUNDARY_MAPPINGS.DEFAULT;

  return mapping?.adminLevelMapping[adminLevelNumber] ?? null;
}

/**
 * Get all supported admin levels for a country
 * @param countryCode The ISO country code
 * @returns Array of supported admin_level numbers
 */
export function getSupportedAdminLevels(countryCode: string): number[] {
  const mapping =
    COUNTRY_BOUNDARY_MAPPINGS[countryCode] ?? COUNTRY_BOUNDARY_MAPPINGS.DEFAULT;
  return Object.keys(mapping?.adminLevelMapping ?? {}).map(Number);
}

/**
 * Get supported admin levels as SQL IN clause string
 * @param countryCode The ISO country code
 * @returns String like "(2,4,6,8,9,10)" for use in SQL queries
 */
export function getSupportedAdminLevelsSQL(countryCode: string): string {
  const levels = getSupportedAdminLevels(countryCode);
  return `(${levels.join(",")})`;
}
