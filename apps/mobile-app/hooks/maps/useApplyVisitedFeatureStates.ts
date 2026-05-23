import { type MapView } from "@rnmapbox/maps";
import { getMvtIdFromPoiId } from "@vagabond/shared-utils";
import { type RefObject, useEffect, useRef, useState } from "react";

import { MAP_SOURCE_IDS, MAP_SOURCE_LAYER_IDS } from "@/constants/MapSources";

const CHUNK_SIZE = 50;

const applyForSource = (
  map: MapView,
  mvtIds: number[],
  visited: boolean,
  sourceId: string,
  sourceLayerId: string,
): void => {
  for (const mvtId of mvtIds) {
    void map.setFeatureState(
      String(mvtId),
      { visited },
      sourceId,
      sourceLayerId,
    );
  }
};

const computeMvtIds = (poiIds: string[]): Set<number> => {
  const mvtIds = new Set<number>();
  for (const poiId of poiIds) {
    try {
      mvtIds.add(getMvtIdFromPoiId(poiId));
    } catch {
      // Format inconnu (futur AI/CUSTOM non encore supporté) — skip silencieux.
    }
  }
  return mvtIds;
};

const diffSets = (
  current: Set<number>,
  previous: Set<number>,
): { toAdd: number[]; toRemove: number[] } => {
  const toAdd: number[] = [];
  const toRemove: number[] = [];
  for (const id of current) {
    if (!previous.has(id)) toAdd.push(id);
  }
  for (const id of previous) {
    if (!current.has(id)) toRemove.push(id);
  }
  return { toAdd, toRemove };
};

const applyChunked = async (
  mapRef: RefObject<MapView | null>,
  ids: number[],
  visited: boolean,
  isCancelled: () => boolean,
  appliedRef: { current: Set<number> },
): Promise<void> => {
  const map = mapRef.current;
  if (map === null) return;

  for (let start = 0; start < ids.length; start += CHUNK_SIZE) {
    if (isCancelled()) return;
    const chunk = ids.slice(start, start + CHUNK_SIZE);
    applyForSource(
      map,
      chunk,
      visited,
      MAP_SOURCE_IDS.POIS,
      MAP_SOURCE_LAYER_IDS.POIS_DATA,
    );
    applyForSource(
      map,
      chunk,
      visited,
      MAP_SOURCE_IDS.POIS_VORONOI,
      MAP_SOURCE_LAYER_IDS.VORONOI_ZONES,
    );
    if (visited) {
      for (const id of chunk) appliedRef.current.add(id);
    } else {
      for (const id of chunk) appliedRef.current.delete(id);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

export const useApplyVisitedFeatureStates = (
  mapRef: RefObject<MapView | null>,
  visitedPoiIds: string[],
  isVisitedReady: boolean,
): { onDidFinishLoadingStyle: () => void } => {
  const [styleLoaded, setStyleLoaded] = useState(false);
  // Reflète l'état effectivement posé sur le bridge Mapbox (mis à jour chunk
  // par chunk). En cas de cancellation à mi-passe, le ref reste cohérent avec
  // ce qui est réellement visited sur la map — la passe suivante calcule le
  // diff vs cet état réel et finit le travail.
  const appliedMvtIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!styleLoaded || !isVisitedReady) return;

    let cancelled = false;
    const isCancelled = (): boolean => cancelled;
    const current = computeMvtIds(visitedPoiIds);
    const { toAdd, toRemove } = diffSets(current, appliedMvtIdsRef.current);

    void (async (): Promise<void> => {
      await applyChunked(mapRef, toAdd, true, isCancelled, appliedMvtIdsRef);
      if (isCancelled()) return;
      await applyChunked(
        mapRef,
        toRemove,
        false,
        isCancelled,
        appliedMvtIdsRef,
      );
    })();

    return (): void => {
      cancelled = true;
    };
  }, [styleLoaded, isVisitedReady, mapRef, visitedPoiIds]);

  const onDidFinishLoadingStyle = (): void => {
    setStyleLoaded(true);
  };

  return { onDidFinishLoadingStyle };
};
