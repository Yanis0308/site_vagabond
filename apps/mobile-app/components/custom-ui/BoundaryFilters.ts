/**
 * IDs des arrondissements de Paris (20 arrondissements)
 * Format: R-{osm_id} (sans le préfixe OSM-)
 */
const PARIS_DISTRICT_IDS = [
  "R-9528", // Paris 10e Arrondissement
  "R-9533", // Paris 11e Arrondissement
  "R-9525", // Paris 12e Arrondissement
  "R-9530", // Paris 13e Arrondissement
  "R-9522", // Paris 14e Arrondissement
  "R-9520", // Paris 15e Arrondissement
  "R-9517", // Paris 16e Arrondissement
  "R-9519", // Paris 17e Arrondissement
  "R-9531", // Paris 18e Arrondissement
  "R-9552", // Paris 19e Arrondissement
  "R-20727", // Paris 1er Arrondissement
  "R-9529", // Paris 20e Arrondissement
  "R-9542", // Paris 2e Arrondissement
  "R-20742", // Paris 3e Arrondissement
  "R-9597", // Paris 4e Arrondissement
  "R-20873", // Paris 5e Arrondissement
  "R-9527", // Paris 6e Arrondissement
  "R-9521", // Paris 7e Arrondissement
  "R-20872", // Paris 8e Arrondissement
  "R-9537", // Paris 9e Arrondissement
];

/**
 * IDs des arrondissements de Marseille (16 arrondissements)
 * Format: R-{osm_id} (sans le préfixe OSM-)
 */
const MARSEILLE_DISTRICT_IDS = [
  "R-76349", // Marseille 10e Arrondissement
  "R-76375", // Marseille 11e Arrondissement
  "R-76382", // Marseille 12e Arrondissement
  "R-76399", // Marseille 13e Arrondissement
  "R-76403", // Marseille 14e Arrondissement
  "R-76409", // Marseille 15e Arrondissement
  "R-76421", // Marseille 16e Arrondissement
  "R-76091", // Marseille 1er Arrondissement
  "R-76098", // Marseille 2e Arrondissement
  "R-76105", // Marseille 3e Arrondissement
  "R-76119", // Marseille 4e Arrondissement
  "R-76178", // Marseille 5e Arrondissement
  "R-76190", // Marseille 6e Arrondissement
  "R-76217", // Marseille 7e Arrondissement
  "R-76282", // Marseille 8e Arrondissement
  "R-76337", // Marseille 9e Arrondissement
];

/**
 * IDs des arrondissements de Lyon (9 arrondissements)
 * Format: R-{osm_id} (sans le préfixe OSM-)
 */
const LYON_DISTRICT_IDS = [
  "R-10690", // Lyon 1er Arrondissement
  "R-10680", // Lyon 2e Arrondissement
  "R-120967", // Lyon 3e Arrondissement
  "R-18510", // Lyon 4e Arrondissement
  "R-10688", // Lyon 5e Arrondissement
  "R-10679", // Lyon 6e Arrondissement
  "R-10682", // Lyon 7e Arrondissement
  "R-10686", // Lyon 8e Arrondissement
  "R-120966", // Lyon 9e Arrondissement
];

/**
 * IDs de tous les arrondissements autorisés à l'affichage
 * (Paris: 20, Marseille: 16, Lyon: 9)
 */
export const ALLOWED_DISTRICT_IDS = [
  ...PARIS_DISTRICT_IDS,
  ...MARSEILLE_DISTRICT_IDS,
  ...LYON_DISTRICT_IDS,
];

/**
 * IDs des villes qui ont leurs districts gérés
 * Format: R-{osm_id} (sans le préfixe OSM-)
 */
export const CITIES_WITH_MANAGED_DISTRICTS = [
  "R-7444", // Paris
  "R-76469", // Marseille
  "R-120965", // Lyon
];

/**
 * Niveaux de boundaries à exclure complètement de l'affichage
 */
export const EXCLUDED_BOUNDARY_LEVELS: string[] = ["NEIGHBORHOOD"];

/**
 * Vérifie si un niveau de boundary doit être affiché
 */
export function shouldDisplayBoundaryLevel(boundaryLevel: string): boolean {
  return !EXCLUDED_BOUNDARY_LEVELS.includes(boundaryLevel);
}

/**
 * Retourne le filtre Mapbox pour un niveau de boundary donné
 * @returns Le filtre Mapbox ou undefined si aucun filtre n'est nécessaire
 */
export function getBoundaryFilter(
  boundaryLevel: string,
): unknown[] | undefined {
  // Pour les DISTRICT, filtrer pour n'afficher que les arrondissements de Paris, Marseille et Lyon
  if (boundaryLevel === "DISTRICT") {
    return ["in", ["get", "id"], ["literal", ALLOWED_DISTRICT_IDS]];
  }

  return undefined;
}

/**
 * Combines base boundary filter with a state filter (zone IDs).
 * Use for layering: unvisited (bottom), inProgress, completed (top).
 */
export function combineBoundaryFilter(
  baseFilter: unknown[] | undefined,
  stateFilter: unknown[] | undefined,
): unknown[] | undefined {
  if (stateFilter === undefined) {
    return baseFilter;
  }
  if (baseFilter === undefined) {
    return stateFilter;
  }
  return ["all", baseFilter, stateFilter];
}
