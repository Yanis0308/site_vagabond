import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";

import { placesAtom } from "@/hooks/other/usePlaceSelection";
import { getPlaces } from "@/http/places";
import { calculateBboxWithMinSize } from "@/utils/bbox";
import { logger } from "@/utils/logger";
import { type BoundingBoxType, type PoiType } from "@/utils/types";

import { useBboxCacheData, useMergeBboxCache } from "./useBboxCacheUtils";

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

  // Récupérer TOUTES les données du cache et vérifier si on a besoin de fetch
  // IMPORTANT : On passe fetchBbox (zone étendue) et non viewBbox (zone visible)
  const { allData, needsFetch } = useBboxCacheData<PoiType[]>(
    "places",
    viewBbox,
  );

  const queryResult = useQuery({
    queryKey: ["places", fetchBbox],
    enabled: needsFetch && zoom !== null && zoom >= 11,
    queryFn: async () => {
      logger("fetching places for fetchBbox:", fetchBbox);

      if (fetchBbox === null) {
        return [];
      }

      const places = await getPlaces(fetchBbox);

      return places;
    },
    // Augmenter le staleTime car TanStack Query gère le cache automatiquement
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fusionner automatiquement les données UNIQUEMENT quand une nouvelle requête réussit
  // Ne pas déclencher à chaque re-render où data existe déjà
  useMergeBboxCache(
    "places",
    fetchBbox,
    queryResult.isSuccess && queryResult.isFetching === false
      ? queryResult.data
      : undefined,
  );

  // Fusionner TOUTES les données : cache existant + nouvelles données de la requête
  const finalData = useMemo(() => {
    if (allData === undefined && queryResult.data === undefined) {
      return undefined;
    }

    if (allData === undefined) {
      return queryResult.data;
    }

    if (queryResult.data === undefined) {
      return allData;
    }

    // Fusionner les deux et éliminer les doublons
    const combined = [...allData, ...queryResult.data];
    const uniqueData = Array.from(
      new Map(combined.map((item) => [item.id, item])).values(),
    );

    return uniqueData;
  }, [allData, queryResult.data]);

  const setPlaces = useSetAtom(placesAtom);

  // Mettre à jour l'atom automatiquement quand les données changent
  useEffect(() => {
    setPlaces({ data: finalData, isFetching: queryResult.isFetching });
  }, [finalData, queryResult.isFetching, setPlaces]);

  return useMemo(
    () => ({
      data: finalData,
      isSuccess: queryResult.isSuccess,
      isFetching: queryResult.isFetching,
      isLoading: queryResult.isLoading,
      error: queryResult.error,
    }),
    [
      finalData,
      queryResult.isSuccess,
      queryResult.isFetching,
      queryResult.isLoading,
      queryResult.error,
    ],
  );
};
