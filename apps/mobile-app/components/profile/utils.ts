// Types pour la hiérarchie des zones — adaptés au schema v2 (sans validated_pois embarqués).
// Les POIs visités sont lazy-loadés à l'expansion via useVisitedPoisByBoundary.
export interface City {
  zoneId: string;
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  lastVisitedPoiAt: string | null;
  lastVisitedPoiName: string | null;
}

export interface Departement {
  zoneId: string;
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  totalSubzonesCount: number;
  completedSubzonesCount: number;
  cities: City[];
}

export interface Region {
  zoneId: string;
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  totalSubzonesCount: number;
  completedSubzonesCount: number;
  departements: Departement[];
}

export interface Country {
  zoneId: string;
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  regions: Region[];
  totalSubzonesCount: number;
}

export type CountryType = Country;
export type RegionType = Region;
export type DepartementType = Departement;
export type CityType = City;

export interface Stats {
  visitedPlaces: number;
  regions: number;
  departements: number;
  totalDepartements: number;
  cities: number;
  lastVisitedDate?: Date;
  lastVisitedPlaceName?: string;
}

export interface ProgressData {
  percentage: number;
  visited: number;
  total: number;
}

function timestamp(at: string | null): number {
  return at !== null ? new Date(at).getTime() : 0;
}

function latestCityTimestamp(cities: CityType[]): number {
  let latest = 0;
  for (const city of cities) {
    const ts = timestamp(city.lastVisitedPoiAt);
    if (ts > latest) {
      latest = ts;
    }
  }
  return latest;
}

function latestRegionTimestamp(region: RegionType): number {
  let latest = 0;
  for (const dept of region.departements) {
    const ts = latestCityTimestamp(dept.cities);
    if (ts > latest) {
      latest = ts;
    }
  }
  return latest;
}

// Tri par date du dernier POI visité (récent en premier) — dérivé des villes.
export function sortRegionsByLatestPoiDate(
  regions: RegionType[],
): RegionType[] {
  return [...regions]
    .map((region) => ({
      ...region,
      departements: sortDepartementsByLatestPoiDate(region.departements),
    }))
    .sort((a, b) => latestRegionTimestamp(b) - latestRegionTimestamp(a));
}

export function sortDepartementsByLatestPoiDate(
  departements: DepartementType[],
): DepartementType[] {
  return [...departements]
    .map((dept) => ({
      ...dept,
      cities: sortCitiesByLatestPoiDate(dept.cities),
    }))
    .sort(
      (a, b) => latestCityTimestamp(b.cities) - latestCityTimestamp(a.cities),
    );
}

export function sortCitiesByLatestPoiDate(cities: CityType[]): CityType[] {
  return [...cities].sort(
    (a, b) => timestamp(b.lastVisitedPoiAt) - timestamp(a.lastVisitedPoiAt),
  );
}

// Nombre total de départements en France métropolitaine
const TOTAL_DEPARTEMENTS_FRANCE = 96;

// Le `lastVisited*` est désormais fourni par l'API (last_visited_poi_at/name par boundary).
// On agrège sur les villes en prenant le max, plus de scan de l'arbre des POIs.
export function calculateStats(zoneHierarchy: CountryType[]): Stats {
  let visitedPlaces = 0;
  let regions = 0;
  let departements = 0;
  let cities = 0;

  let latestDate = 0;
  let latestName: string | null = null;

  for (const country of zoneHierarchy) {
    for (const region of country.regions) {
      regions++;
      for (const dept of region.departements) {
        departements++;
        for (const city of dept.cities) {
          cities++;
          visitedPlaces += city.validatedPoisCount;
          const cityAt = timestamp(city.lastVisitedPoiAt);
          if (cityAt > latestDate) {
            latestDate = cityAt;
            latestName = city.lastVisitedPoiName;
          }
        }
      }
    }
  }

  return {
    visitedPlaces,
    regions,
    departements,
    totalDepartements: TOTAL_DEPARTEMENTS_FRANCE,
    cities,
    lastVisitedDate: latestDate > 0 ? new Date(latestDate) : undefined,
    lastVisitedPlaceName: latestName ?? undefined,
  };
}

export function calculateRegionsProgress(
  zoneHierarchy: CountryType[],
): ProgressData {
  const total = zoneHierarchy[0]?.totalSubzonesCount ?? 0;
  let visited = 0;

  for (const country of zoneHierarchy) {
    visited += country.regions.length;
  }

  const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;

  return {
    percentage,
    visited,
    total,
  };
}
