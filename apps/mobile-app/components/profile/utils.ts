import type { BriefVisitedPoi } from "@vagabond/shared-utils";

// Types pour la hiérarchie des zones
export interface City {
  zoneId: string;
  name: string;
  totalPoisCount: number;
  validatedPoisCount: number;
  pois: BriefVisitedPoi[];
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

// Fonction pour trier les POIs par date décroissante
export function sortPoisByDate(pois: BriefVisitedPoi[]): BriefVisitedPoi[] {
  return [...pois].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Plus récent en premier
  });
}

// Fonction pour obtenir la date du POI le plus récent dans une zone
export function getLatestPoiDate(pois: BriefVisitedPoi[]): number {
  if (pois.length === 0) return 0;
  return Math.max(...pois.map((poi) => new Date(poi.createdAt).getTime()));
}

// Fonction pour trier les régions par date du POI le plus récent (récursif)
export function sortRegionsByLatestPoiDate(
  regions: RegionType[],
): RegionType[] {
  return [...regions]
    .map((region) => ({
      ...region,
      departements: sortDepartementsByLatestPoiDate(region.departements),
    }))
    .sort((a, b) => {
      // Obtenir la date la plus récente parmi tous les POIs de la région
      const getAllPoisFromRegion = (r: RegionType): BriefVisitedPoi[] => {
        const allPois: BriefVisitedPoi[] = [];
        for (const dept of r.departements) {
          for (const city of dept.cities) {
            allPois.push(...city.pois);
          }
        }
        return allPois;
      };
      const dateA = getLatestPoiDate(getAllPoisFromRegion(a));
      const dateB = getLatestPoiDate(getAllPoisFromRegion(b));
      return dateB - dateA;
    });
}

// Fonction pour trier les départements par date du POI le plus récent (récursif)
export function sortDepartementsByLatestPoiDate(
  departements: DepartementType[],
): DepartementType[] {
  return [...departements]
    .map((dept) => ({
      ...dept,
      cities: sortCitiesByLatestPoiDate(dept.cities),
    }))
    .sort((a, b) => {
      // Obtenir la date la plus récente parmi tous les POIs du département
      const getAllPoisFromDepartement = (
        d: DepartementType,
      ): BriefVisitedPoi[] => {
        const allPois: BriefVisitedPoi[] = [];
        for (const city of d.cities) {
          allPois.push(...city.pois);
        }
        return allPois;
      };
      const dateA = getLatestPoiDate(getAllPoisFromDepartement(a));
      const dateB = getLatestPoiDate(getAllPoisFromDepartement(b));
      return dateB - dateA;
    });
}

// Fonction pour trier les villes par date du POI le plus récent
export function sortCitiesByLatestPoiDate(cities: CityType[]): CityType[] {
  return [...cities]
    .map((city) => ({
      ...city,
      pois: sortPoisByDate(city.pois),
    }))
    .sort((a, b) => {
      const dateA = getLatestPoiDate(a.pois);
      const dateB = getLatestPoiDate(b.pois);
      return dateB - dateA;
    });
}

// Nombre total de départements en France métropolitaine
const TOTAL_DEPARTEMENTS_FRANCE = 96;

// Fonction pour calculer les statistiques
export function calculateStats(zoneHierarchy: CountryType[]): Stats {
  let visitedPlaces = 0;
  let regions = 0;
  let departements = 0;
  let cities = 0;

  let latestPoi: BriefVisitedPoi | null = null;
  let latestPoiDate = 0;

  for (const country of zoneHierarchy) {
    for (const region of country.regions) {
      regions++;
      for (const dept of region.departements) {
        departements++;
        for (const city of dept.cities) {
          cities++;
          const pois = city.pois;
          visitedPlaces += pois.length;

          // Trouver le POI le plus récent pendant la boucle
          for (const poi of pois) {
            const poiDate = new Date(poi.createdAt).getTime();
            if (poiDate > latestPoiDate) {
              latestPoiDate = poiDate;
              latestPoi = poi;
            }
          }
        }
      }
    }
  }

  const lastVisitedDate =
    latestPoiDate > 0 ? new Date(latestPoiDate) : undefined;
  const lastVisitedPlaceName = latestPoi?.name;

  return {
    visitedPlaces,
    regions,
    departements,
    totalDepartements: TOTAL_DEPARTEMENTS_FRANCE,
    cities,
    lastVisitedDate,
    lastVisitedPlaceName,
  };
}

// Fonction pour calculer le pourcentage de régions visitées
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
