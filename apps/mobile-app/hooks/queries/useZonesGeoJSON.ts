import { useQuery } from "@tanstack/react-query";

import { type ZoneStatType } from "@/utils/types";

import { useAllZones } from "./useAllZones";
import { useValidatedPlaces } from "./useValidatedPlaces";

/**
 * Hook qui combine les données des zones et des visited places
 * pour générer le GeoJSON optimisé avec les statistiques de complétion
 */
export const useZonesGeoJSON = (): {
  data: GeoJSON.FeatureCollection | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
} => {
  // Récupérer les données des zones et des visited places
  const zonesQuery = useAllZones();
  const visitedPlacesQuery = useValidatedPlaces();

  // Utiliser TanStack Query pour transformer et cacher les données
  return useQuery({
    queryKey: ["zones-geojson", zonesQuery.data, visitedPlacesQuery.data],
    queryFn: () => {
      if (
        zonesQuery.data === undefined ||
        visitedPlacesQuery.data === undefined
      ) {
        return {
          type: "FeatureCollection" as const,
          features: [],
        };
      }

      // Optimisation : une seule structure pour tout + calcul récursif
      const zoneStats = new Map<
        string,
        {
          visitedPois: number;
          totalChildren: number;
          visitedChildren: number;
        }
      >();

      // 1. Initialiser avec les POI visités par zone
      for (const visitedPlace of visitedPlacesQuery.data) {
        const current = zoneStats.get(visitedPlace.zoneId) ?? {
          visitedPois: 0,
          totalChildren: 0,
          visitedChildren: 0,
        };
        current.visitedPois += 1;
        zoneStats.set(visitedPlace.zoneId, current);
      }

      // 2. S'assurer que toutes les zones existent dans la map
      for (const zone of zonesQuery.data) {
        if (!zoneStats.has(zone.zone_id)) {
          zoneStats.set(zone.zone_id, {
            visitedPois: 0,
            totalChildren: 0,
            visitedChildren: 0,
          });
        }
      }

      // 3. Optimisation O(n) : créer un index des enfants par parent
      const childrenByParent = new Map<string, string[]>();

      for (const zone of zonesQuery.data) {
        if (zone.parent_id !== null) {
          const siblings = childrenByParent.get(zone.parent_id) ?? [];
          siblings.push(zone.zone_id);
          childrenByParent.set(zone.parent_id, siblings);
        }
      }

      // 4. Calculer dans l'ordre hiérarchique (plus petit en premier)
      const boundaryLevelOrder = [
        "NEIGHBORHOOD", // admin_level=10
        "DISTRICT", // admin_level=9
        "CITY", // admin_level=8
        "COUNTY", // admin_level=6
        "REGION", // admin_level=4
        "COUNTRY", // admin_level=2
      ] as const;

      const sortedZones = [...zonesQuery.data].sort((a, b) => {
        const aIndex = boundaryLevelOrder.indexOf(a.boundary_level);
        const bIndex = boundaryLevelOrder.indexOf(b.boundary_level);
        return aIndex - bIndex;
      });

      for (const zone of sortedZones) {
        const stats = zoneStats.get(zone.zone_id);
        if (stats === undefined) continue;

        const childrenIds = childrenByParent.get(zone.zone_id) ?? [];
        stats.totalChildren = childrenIds.length;

        // Si la zone a des enfants → compter combien d'enfants sont visités
        if (stats.totalChildren > 0) {
          stats.visitedChildren = childrenIds.filter((childId) => {
            const childStats = zoneStats.get(childId);
            // Une zone enfant est "visitée" si elle a des POI directs visités
            // OU si elle a des zones enfants visitées
            return (
              childStats !== undefined &&
              (childStats.visitedPois > 0 || childStats.visitedChildren > 0)
            );
          }).length;
        } else {
          // Pas d'enfants → garder les POI directs
          stats.visitedChildren = 0;
        }
      }

      return transformZonesToGeoJSON(zonesQuery.data, zoneStats);
    },

    enabled:
      zonesQuery.data !== undefined && visitedPlacesQuery.data !== undefined,
  });
};

/**
 * Fonction pure pour transformer les données des zones et visited places
 * en GeoJSON avec les statistiques de complétion calculées côté frontend
 */
function transformZonesToGeoJSON(
  zonesData: ZoneStatType[],
  zoneStats: Map<
    string,
    {
      visitedPois: number;
      totalChildren: number;
      visitedChildren: number;
    }
  >,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zonesData.map((zone) => {
      const stats = zoneStats.get(zone.zone_id) ?? {
        visitedPois: 0,
        totalChildren: 0,
        visitedChildren: 0,
      };

      return {
        type: "Feature",
        id: zone.zone_id,
        properties: {
          // POI/Zone stats properties
          name: zone.name,
          total_pois: zone.total_pois,
          // Si la zone a des enfants → afficher les stats des zones enfants
          // Sinon → afficher les stats des POI directs
          nb_visited_pois: stats.totalChildren > 0 ? 0 : stats.visitedPois,
          total_children: stats.totalChildren,
          nb_visited_children: stats.visitedChildren,
          children_completion_rate:
            stats.totalChildren > 0
              ? Math.round((stats.visitedChildren / stats.totalChildren) * 100)
              : zone.total_pois > 0
                ? Math.round((stats.visitedPois / zone.total_pois) * 100)
                : 0,
          // OSM placenames properties
          boundary_level: zone.boundary_level,
          place_type: zone.place_type,
          population: zone.population,
          is_capital: zone.is_capital,
          importance_score: zone.importance_score,
          way_area: zone.way_area,
        },
        geometry: {
          type: "Point",
          coordinates: [zone.point.longitude, zone.point.latitude],
        },
      };
    }),
  };
}
