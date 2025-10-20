import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

import {
  type BboxData,
  bboxToPolygon,
  doBboxesIntersect,
  type GeoPolygon,
  getBboxFromPolygon,
  isBboxInPolygons,
  isPointNearBbox,
  mergePolygons,
} from "@/utils/bbox";
import { logger } from "@/utils/logger";

// Type pour le cache de couverture avec polygones
interface CoverageCache<T> {
  coverage: GeoPolygon[]; // Polygones représentant les zones couvertes
  data: T; // Toutes les données
}

/**
 * Hook utilitaire pour récupérer TOUTES les données du cache avec système de couverture par polygones.
 *
 * Retourne un objet avec :
 * - allData: Toutes les données en cache (pour affichage)
 * - needsFetch: true si la fetchBbox n'est pas complètement couverte par les polygones en cache
 */
export const useBboxCacheData = <T>(
  queryKeyPrefix: string,
  fetchBbox: BboxData | null,
): { allData: T | undefined; needsFetch: boolean } => {
  const queryClient = useQueryClient();

  const result = useMemo(() => {
    if (fetchBbox === null) {
      return { allData: undefined, needsFetch: false };
    }

    // Chercher le cache de couverture
    const coverageKey = [queryKeyPrefix, "coverage"];
    const coverageData =
      queryClient.getQueryData<CoverageCache<T>>(coverageKey);

    // Si pas de cache de couverture, fallback sur l'ancien système
    if (coverageData === undefined) {
      logger(`No coverage cache found for ${queryKeyPrefix}, needs fetch`);
      return { allData: undefined, needsFetch: true };
    }

    const { coverage, data } = coverageData;

    // Vérifier si la fetchBbox est complètement couverte par les polygones
    const isCovered = isBboxInPolygons(fetchBbox, coverage);

    // Filtrer les données pour ne retourner que celles proches de la fetchBbox actuelle
    // Ceci évite de retourner des milliers de POIs de partout dans le monde
    const filteredData = Array.isArray(data)
      ? (data.filter((item: unknown) => {
          const poi = item as {
            coords: { latitude: number; longitude: number };
          };
          return isPointNearBbox(poi.coords, fetchBbox, 30000); // 30km de rayon
        }) as T)
      : data;

    const totalDataLength = Array.isArray(data) ? data.length : 0;
    const filteredDataLength = Array.isArray(filteredData)
      ? filteredData.length
      : 0;

    if (isCovered) {
      logger(
        `Coverage cache has ${totalDataLength} items total, ${filteredDataLength} items near current view (${coverage.length} polygons), fetchBbox is fully covered`,
      );
    } else {
      logger(
        `Coverage cache has ${totalDataLength} items total, ${filteredDataLength} items near current view (${coverage.length} polygons), but fetchBbox is NOT fully covered, will fetch`,
      );
    }

    return { allData: filteredData, needsFetch: !isCovered };
  }, [fetchBbox, queryClient, queryKeyPrefix]);

  return result;
};

/**
 * Hook qui fusionne automatiquement les données d'une nouvelle requête
 * avec le cache de couverture existant en utilisant des polygones.
 *
 * Stratégie intelligente :
 * 1. Convertit la nouvelle bbox en polygone
 * 2. Vérifie quels polygones existants se touchent avec le nouveau
 * 3. Fusionne UNIQUEMENT les polygones qui se touchent entre eux
 * 4. Garde les autres polygones séparés
 * 5. Agrège les données et élimine les doublons
 */
export const useMergeBboxCache = <T extends { id: string | number }[]>(
  queryKeyPrefix: string,
  currentBbox: BboxData | null,
  currentData: T | undefined,
): void => {
  const queryClient = useQueryClient();
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Ne fusionner que si on a des données
    if (
      currentBbox === null ||
      currentData === undefined ||
      currentData.length === 0
    ) {
      return;
    }

    // Créer un identifiant unique pour cette bbox
    const bboxId = `${currentBbox.minLat},${currentBbox.maxLat},${currentBbox.minLng},${currentBbox.maxLng}`;

    // Si on a déjà traité cette bbox, ne rien faire
    if (processedRef.current.has(bboxId)) {
      return;
    }

    processedRef.current.add(bboxId);

    const coverageKey = [queryKeyPrefix, "coverage"];

    // Récupérer le cache de couverture existant
    const existingCache =
      queryClient.getQueryData<CoverageCache<T>>(coverageKey);

    // Convertir la nouvelle bbox en polygone
    const newPolygon = bboxToPolygon(currentBbox);

    let finalCoverage: GeoPolygon[];
    let finalData: T;

    if (existingCache !== undefined) {
      logger(
        `Merging new bbox with existing coverage (${existingCache.coverage.length} polygons, ${Array.isArray(existingCache.data) ? existingCache.data.length : 0} items)`,
      );

      // Trouver quels polygones se touchent avec le nouveau
      const touchingIndices: number[] = [];
      const polygonsToMerge: GeoPolygon[] = [newPolygon];

      existingCache.coverage.forEach((polygon, index) => {
        if (doBboxesIntersect(currentBbox, getBboxFromPolygon(polygon))) {
          touchingIndices.push(index);
          polygonsToMerge.push(polygon);
        }
      });

      // Fusionner les polygones qui se touchent
      const mergedPolygons = mergePolygons(polygonsToMerge);

      // Construire la liste finale : polygones fusionnés + polygones non touchés
      finalCoverage = [
        ...mergedPolygons,
        ...existingCache.coverage.filter(
          (_, index) => !touchingIndices.includes(index),
        ),
      ];

      // Fusionner les données et éliminer les doublons
      const combined = [...existingCache.data, ...currentData];
      finalData = Array.from(
        new Map(combined.map((item) => [item.id, item])).values(),
      ) as T;

      logger(
        `After merge: ${finalCoverage.length} polygons (${mergedPolygons.length} merged, ${existingCache.coverage.length - touchingIndices.length} kept separate), ${finalData.length} unique items`,
      );
    } else {
      logger(`Creating new coverage cache for ${queryKeyPrefix}`);
      finalCoverage = [newPolygon];
      finalData = currentData;
    }

    // Stocker le cache de couverture unique
    queryClient.setQueryData<CoverageCache<T>>(coverageKey, {
      coverage: finalCoverage,
      data: finalData,
    });

    logger(
      `Updated coverage cache: ${finalCoverage.length} polygons covering ${finalData.length} items`,
    );
  }, [queryKeyPrefix, currentBbox, currentData, queryClient]);
};

/**
 * Fonction utilitaire pour forcer le rafraîchissement du cache bbox
 * Utile après des opérations comme la validation d'un point pour s'assurer
 * que les données sont à jour
 */
export const forceBboxCacheRefresh = async (
  queryClient: ReturnType<typeof useQueryClient>,
  queryKeyPrefix: string,
): Promise<void> => {
  logger(`Forcing refresh of bbox cache for ${queryKeyPrefix}`);

  // Invalider toutes les queries liées aux places pour cette bbox
  await queryClient.invalidateQueries({
    queryKey: [queryKeyPrefix],
  });

  // Supprimer le cache de couverture pour forcer un recalcul
  const coverageKey = [queryKeyPrefix, "coverage"];
  queryClient.removeQueries({
    queryKey: coverageKey,
  });

  logger(`Bbox cache refresh completed for ${queryKeyPrefix}`);
};
