import { useQuery } from "@tanstack/react-query";

import { getPlaces } from "@/http/places";
import { logger } from "@/utils/logger";
import { placesCacheManager } from "@/utils/placesCache";
import { calculatePopularity } from "@/utils/popularity";
import { type BoundingBoxType } from "@/utils/types";

//eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for mutation
export const usePlaces = (boundingBox: BoundingBoxType | null) => {
  return useQuery({
    queryKey: ["places", boundingBox],
    queryFn: async () => {
      logger("fetching places for bbox:", boundingBox);

      if (boundingBox === null) {
        return [];
      }

      // Vérifier si cette zone est déjà couverte par le cache
      const cachedPlaces = placesCacheManager.getCachedPlaces(boundingBox);
      if (cachedPlaces !== null) {
        logger("Using cached places instead of API call");
        // cache is disabled for now
      }

      // Si pas de cache, faire la requête API
      logger("No cache found, making API call");
      const places = await getPlaces(boundingBox);

      // Calculer la popularité basée sur nbOfTags
      const placesWithPopularity = calculatePopularity(places);

      // Mettre en cache les résultats avec popularité
      placesCacheManager.setCachedPlaces(boundingBox, placesWithPopularity);

      return placesWithPopularity;
    },
    placeholderData: (previousData) => previousData,
    // Augmenter le staleTime car on gère nous-mêmes le cache
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
