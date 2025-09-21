import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getPlaces } from "@/http/places";
import { calculateBboxWithMinSize } from "@/utils/bbox";
import { logger } from "@/utils/logger";
import { type BoundingBoxType, type PoiType } from "@/utils/types";

import { useBboxCacheData } from "./useBboxCacheUtils";

export const usePlaces = (
  viewBbox: BoundingBoxType | null,
  zoom: number | null,
): {
  data: PoiType[] | undefined;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  // Calculer la fetchBbox (zone de 10km minimum) basée sur la viewBbox
  const fetchBbox = useMemo(() => {
    if (viewBbox === null) {
      return null;
    }

    // Convertir la viewBbox en format attendu par calculateBboxWithMinSize
    const northEast: GeoJSON.Position = [viewBbox.maxLng, viewBbox.maxLat];
    const southWest: GeoJSON.Position = [viewBbox.minLng, viewBbox.minLat];

    return calculateBboxWithMinSize(northEast, southWest, 10000);
  }, [viewBbox]);

  // Utiliser le hook mutualisé pour rechercher des données dans le cache
  const initialData = useBboxCacheData<PoiType[]>("places", viewBbox);

  const queryResult = useQuery({
    queryKey: ["places", fetchBbox],
    enabled: initialData === undefined && zoom !== null && zoom >= 12,
    initialData,
    queryFn: async () => {
      logger("fetching places for fetchBbox:", fetchBbox);

      if (fetchBbox === null) {
        return [];
      }

      const places = await getPlaces(fetchBbox);

      return places;
    },
    placeholderData: (previousData) => previousData,
    // Augmenter le staleTime car TanStack Query gère le cache automatiquement
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return queryResult;
};
