import { useMemo } from "react";

import type { BriefVisitedPoiType, ZoneUserStatType } from "@/utils/types";

interface City {
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  pois: BriefVisitedPoiType[];
}

interface Departement {
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  cities: City[];
}

interface Region {
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  departements: Departement[];
}

interface Country {
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  regions: Region[];
}

function buildZonesHierarchy(data: ZoneUserStatType[]): Country[] {
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
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.validated_pois_count,
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
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.validated_pois_count,
      departements: countyChildren.map(mapToDepartement),
    };
  };

  const mapToCountry = (zone: ZoneUserStatType): Country => {
    const children = byParent.get(zone.zone_id) ?? [];
    // Filter children to only include REGION level zones
    const regionChildren = children.filter(
      (child) => child.boundary_level === "REGION",
    );
    return {
      name: zone.name,
      totalPoisCount: zone.total_pois_count,
      validatedPoisCount: zone.validated_pois_count,
      regions: regionChildren.map(mapToRegion),
    };
  };

  return roots.map(mapToCountry);
}

export const useZoneHierarchy = (data?: ZoneUserStatType[]): Country[] => {
  const zoneHierarchy = useMemo(() => {
    if (data !== undefined) {
      return buildZonesHierarchy(data);
    }
    return [];
  }, [data]);

  return zoneHierarchy;
};
