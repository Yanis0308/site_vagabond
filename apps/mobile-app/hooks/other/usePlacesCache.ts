import { useCallback, useMemo } from "react";

import { logger } from "@/utils/logger";
import { placesCacheManager } from "@/utils/placesCache";

/**
 * Hook utilitaire pour gérer le cache des places
 * Utile pour le debugging et la gestion du cache
 */
export const usePlacesCache = (): {
  clearCache: () => void;
  getCacheInfo: () => unknown;
  isBboxCovered: (bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => boolean;
} => {
  const clearCache = useCallback(() => {
    placesCacheManager.clearCache();
    logger("Cache cleared via hook");
  }, []);

  const getCacheInfo = useCallback(() => {
    const info = placesCacheManager.getCacheInfo();
    logger("Cache info:", info);
    return info;
  }, []);

  const isBboxCovered = useCallback(
    (bbox: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }) => {
      return placesCacheManager.isBboxCovered(bbox);
    },
    [],
  );

  return useMemo(
    () => ({
      clearCache,
      getCacheInfo,
      isBboxCovered,
    }),
    [clearCache, getCacheInfo, isBboxCovered],
  );
};
