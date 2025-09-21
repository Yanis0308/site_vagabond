import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { isBboxContainedIn } from "@/utils/bbox";
import { logger } from "@/utils/logger";
import { type BoundingBoxType } from "@/utils/types";

// Interface pour les données de bbox en cache
interface CachedBboxData {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Hook utilitaire pour rechercher des données dans le cache TanStack Query
 * basé sur des critères de bbox et autres paramètres
 */
export const useBboxCacheData = <T>(
  queryKeyPrefix: string,
  viewBbox: BoundingBoxType | null,
): T | undefined => {
  const queryClient = useQueryClient();

  const initialData = useMemo(() => {
    if (viewBbox === null) {
      return undefined;
    }

    // Chercher dans le cache existant des données pour des bbox qui pourraient contenir nos données
    const queries = queryClient.getQueriesData({ queryKey: [queryKeyPrefix] });

    for (const [queryKey, data] of queries) {
      if (Array.isArray(queryKey) && queryKey.length >= 2 && data !== null) {
        const cachedBbox = queryKey[1] as unknown;

        if (
          cachedBbox !== null &&
          typeof cachedBbox === "object" &&
          "minLat" in cachedBbox &&
          "maxLat" in cachedBbox &&
          "minLng" in cachedBbox &&
          "maxLng" in cachedBbox
        ) {
          const bbox = cachedBbox as CachedBboxData;

          // Vérifier si cette bbox contient notre viewBbox actuelle
          if (isBboxContainedIn(viewBbox, bbox)) {
            logger(
              `Found cached ${queryKeyPrefix} data for current view, using as initialData`,
            );
            return data as T;
          }
        }
      }
    }

    return undefined;
  }, [viewBbox, queryClient, queryKeyPrefix]);

  return initialData;
};
