import { type PoiType } from "./types";

/**
 * Calcule la popularité des POIs basée sur nbOfTags en utilisant la médiane
 * Les valeurs sont normalisées entre 0 et 1
 */
export const calculatePopularity = (places: PoiType[]): PoiType[] => {
  // Extraire tous les nbOfTags non-null de tous les POIs
  const allNbOfTags: number[] = [];

  places.forEach((place) => {
    place.data.forEach((poiData) => {
      if (poiData.nbOfTags !== null) {
        allNbOfTags.push(poiData.nbOfTags);
      }
    });
  });

  // Si pas de données, retourner les places sans modification
  if (allNbOfTags.length === 0) {
    return places.map((place) => ({
      ...place,
      popularity: 0,
    }));
  }

  // Calculer la médiane
  const sortedTags = [...allNbOfTags].sort((a, b) => a - b);
  let median: number;

  if (sortedTags.length % 2 === 0) {
    const mid1 = sortedTags[sortedTags.length / 2 - 1];
    const mid2 = sortedTags[sortedTags.length / 2];
    if (mid1 !== undefined && mid2 !== undefined) {
      median = (mid1 + mid2) / 2;
    } else {
      median = 0;
    }
  } else {
    const midValue = sortedTags[Math.floor(sortedTags.length / 2)];
    median = midValue ?? 0;
  }

  // Trouver les valeurs min et max pour la normalisation
  const minTags = Math.min(...allNbOfTags);
  const maxTags = Math.max(...allNbOfTags);

  // Classer chaque POI en calculant sa popularité
  return places.map((place) => {
    // Prendre la valeur maximale de nbOfTags parmi tous les poiData du POI
    const validNbOfTags = place.data
      .filter((poiData) => poiData.nbOfTags !== null)
      .map((poiData) => poiData.nbOfTags ?? 0);

    const maxNbOfTagsForPlace =
      validNbOfTags.length > 0 ? Math.max(...validNbOfTags) : -Infinity;

    let popularity: number;

    // Si aucune donnée nbOfTags pour ce POI
    if (!isFinite(maxNbOfTagsForPlace)) {
      popularity = 0;
    } else {
      // Normaliser entre 0 et 1 en utilisant la médiane comme point de référence
      if (maxNbOfTagsForPlace <= median) {
        // En dessous ou égal à la médiane : 0 à 0.5
        popularity =
          maxTags === minTags
            ? 0.5
            : (0.5 * (maxNbOfTagsForPlace - minTags)) / (median - minTags);
      } else {
        // Au-dessus de la médiane : 0.5 à 1
        popularity =
          maxTags === median
            ? 0.5
            : 0.5 + (0.5 * (maxNbOfTagsForPlace - median)) / (maxTags - median);
      }

      // S'assurer que la valeur est entre 0 et 1
      popularity = Math.max(0, Math.min(1, popularity));
    }

    return {
      ...place,
      popularity,
    };
  });
};
