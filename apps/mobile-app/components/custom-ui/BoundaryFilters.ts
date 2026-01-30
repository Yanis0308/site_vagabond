/**
 * IDs des 20 arrondissements de Paris (récupérés depuis la base de données)
 * Format: R-{osm_id} (sans le préfixe OSM-)
 */
export const PARIS_DISTRICT_IDS = [
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
  // Pour les DISTRICT, filtrer pour n'afficher que les arrondissements de Paris
  if (boundaryLevel === "DISTRICT") {
    return ["in", ["get", "id"], ["literal", PARIS_DISTRICT_IDS]];
  }

  return undefined;
}
