import { type MapView } from "@rnmapbox/maps";
import { useAsyncDebouncedCallback } from "@tanstack/react-pacer";
import { useEffect, useState } from "react";

import { getZoneFromLocation } from "@/utils/getZoneFromLocation";
import { logger } from "@/utils/logger";
import { getSourceLayerForZoom } from "@/utils/map-zone";

interface UseMapZoneInfoParams {
  mapView: MapView | null;
  mapCenter: { longitude: number; latitude: number } | null;
  zoom: number | null;
}

export const useMapZoneInfo = ({
  mapView,
  mapCenter,
  zoom,
}: UseMapZoneInfoParams): string | null => {
  const [zoneName, setZoneName] = useState<string | null>(null);

  const longitude = mapCenter?.longitude ?? null;
  const latitude = mapCenter?.latitude ?? null;
  const sourceLayerId = getSourceLayerForZoom(zoom ?? 0);

  const fetchZoneDebounced = useAsyncDebouncedCallback(
    async (): Promise<void> => {
      if (
        mapView === null ||
        longitude === null ||
        latitude === null ||
        sourceLayerId === null
      ) {
        setZoneName(null);
        return;
      }

      try {
        const nextZoneName = await getZoneFromLocation(
          mapView,
          longitude,
          latitude,
          sourceLayerId,
        );

        setZoneName((currentZoneName) => {
          return currentZoneName === nextZoneName
            ? currentZoneName
            : nextZoneName;
        });
      } catch (error) {
        // querySourceFeatures peut échouer si la carte est démontée ou la
        // tuile non encore chargée — zoneName reste à sa valeur précédente
        logger("[useMapZoneInfo] fetchZone error:", error);
      }
    },
    { wait: 100 },
  );

  useEffect((): void => {
    void fetchZoneDebounced();
  }, [fetchZoneDebounced, latitude, longitude, mapView, sourceLayerId]);

  return zoneName;
};
