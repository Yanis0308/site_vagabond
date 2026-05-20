import type { ZoneUserStatV2 } from "@vagabond/shared-utils";
import { useMemo } from "react";

import type {
  City,
  CountryType,
  Departement,
  Region,
} from "@/components/profile/utils";

function buildZonesHierarchy(data: ZoneUserStatV2[]): CountryType[] {
  const byParent = new Map<string | null, ZoneUserStatV2[]>();
  for (const z of data) {
    const bucket = byParent.get(z.parent_id) ?? [];
    bucket.push(z);
    byParent.set(z.parent_id, bucket);
  }

  const roots = (byParent.get(null) ?? []).filter(
    (z) => z.boundary_level === "COUNTRY",
  );
  if (roots.length === 0) return [];

  const sortByName = (arr: ZoneUserStatV2[]): ZoneUserStatV2[] =>
    arr.sort((a, b) => a.name.localeCompare(b.name));

  for (const [k, arr] of byParent) {
    byParent.set(k, sortByName(arr));
  }

  const mapToCity = (zone: ZoneUserStatV2): City => ({
    zoneId: zone.zone_id,
    name: zone.name,
    totalPoisCount: zone.total_pois_count,
    validatedPoisCount: zone.visited_pois_count,
    lastVisitedPoiAt: zone.last_visited_poi_at,
    lastVisitedPoiName: zone.last_visited_poi_name,
  });

  const mapToDepartement = (zone: ZoneUserStatV2): Departement => {
    const children = byParent.get(zone.zone_id) ?? [];
    const cityChildren = children.filter(
      (child) => child.boundary_level === "CITY",
    );
    const cities = cityChildren.map(mapToCity);
    return {
      zoneId: zone.zone_id,
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.visited_pois_count,
      totalSubzonesCount: zone.total_subzones_count,
      completedSubzonesCount: zone.completed_subzones_count,
      cities,
    };
  };

  const mapToRegion = (zone: ZoneUserStatV2): Region => {
    const children = byParent.get(zone.zone_id) ?? [];
    const countyChildren = children.filter(
      (child) => child.boundary_level === "COUNTY",
    );
    const departements = countyChildren.map(mapToDepartement);
    return {
      zoneId: zone.zone_id,
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.visited_pois_count,
      totalSubzonesCount: zone.total_subzones_count,
      completedSubzonesCount: zone.completed_subzones_count,
      departements,
    };
  };

  const mapToCountry = (zone: ZoneUserStatV2): CountryType => {
    const children = byParent.get(zone.zone_id) ?? [];
    const regionChildren = children.filter(
      (child) => child.boundary_level === "REGION",
    );
    return {
      zoneId: zone.zone_id,
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.visited_pois_count,
      regions: regionChildren.map(mapToRegion),
      totalSubzonesCount: zone.total_subzones_count,
    };
  };

  return roots.map(mapToCountry);
}

export const useZoneHierarchy = (data?: ZoneUserStatV2[]): CountryType[] => {
  return useMemo(() => {
    if (data !== undefined) {
      return buildZonesHierarchy(data);
    }
    return [];
  }, [data]);
};
