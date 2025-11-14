import { useMemo } from "react";

import type {
  City,
  CountryType,
  Departement,
  Region,
} from "@/components/profile/utils";
import type { ZoneUserStatType } from "@/utils/types";

function buildZonesHierarchy(data: ZoneUserStatType[]): CountryType[] {
  const byParent = new Map<string | null, ZoneUserStatType[]>();
  for (const z of data) {
    const bucket = byParent.get(z.parent_id) ?? [];
    bucket.push(z);
    byParent.set(z.parent_id, bucket);
  }

  const roots = (byParent.get(null) ?? []).filter(
    (z) => z.boundary_level === "COUNTRY",
  );
  if (roots.length === 0) return [];

  const sortByName = (arr: ZoneUserStatType[]): ZoneUserStatType[] =>
    arr.sort((a, b) => a.name.localeCompare(b.name));

  for (const [k, arr] of byParent) {
    byParent.set(k, sortByName(arr));
  }

  // Helper functions to map specific zone types with proper type safety
  const mapToCity = (zone: ZoneUserStatType): City => {
    return {
      zoneId: zone.zone_id,
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.validated_pois_count,
      pois: zone.validated_pois ?? [],
    };
  };

  const mapToDepartement = (zone: ZoneUserStatType): Departement => {
    const children = byParent.get(zone.zone_id) ?? [];
    // Filter children to only include CITY level zones
    const cityChildren = children.filter(
      (child) => child.boundary_level === "CITY",
    );
    return {
      zoneId: zone.zone_id,
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.validated_pois_count,
      totalSubzonesCount: zone.total_subzones_count,
      completedSubzonesCount: zone.completed_subzones_count,
      cities: cityChildren.map(mapToCity),
    };
  };

  const mapToRegion = (zone: ZoneUserStatType): Region => {
    const children = byParent.get(zone.zone_id) ?? [];
    // Filter children to only include COUNTY level zones
    const countyChildren = children.filter(
      (child) => child.boundary_level === "COUNTY",
    );
    return {
      zoneId: zone.zone_id,
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.validated_pois_count,
      totalSubzonesCount: zone.total_subzones_count,
      completedSubzonesCount: zone.completed_subzones_count,
      departements: countyChildren.map(mapToDepartement),
    };
  };

  const mapToCountry = (zone: ZoneUserStatType): CountryType => {
    const children = byParent.get(zone.zone_id) ?? [];
    // Filter children to only include REGION level zones
    const regionChildren = children.filter(
      (child) => child.boundary_level === "REGION",
    );
    return {
      zoneId: zone.zone_id,
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.validated_pois_count,
      regions: regionChildren.map(mapToRegion),
      totalSubzonesCount: zone.total_subzones_count,
    };
  };

  return roots.map(mapToCountry);
}

export const useZoneHierarchy = (data?: ZoneUserStatType[]): CountryType[] => {
  const zoneHierarchy = useMemo(() => {
    if (data !== undefined) {
      return buildZonesHierarchy(data);
    }
    return [];
  }, [data]);

  return zoneHierarchy;
};
