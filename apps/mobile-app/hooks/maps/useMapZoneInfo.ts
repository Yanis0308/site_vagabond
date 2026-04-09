import { type MapView } from "@rnmapbox/maps";
import { useAsyncDebouncedCallback } from "@tanstack/react-pacer";
import { useEffect, useState } from "react";

import { layersInfos } from "@/constants/MapLayersConfig";
import { getZoneFromLocation } from "@/utils/getZoneFromLocation";
import { logger } from "@/utils/logger";

/**
 * Seuils de zoom → source layer, ordonnés du plus zoomé au plus large.
 * Suit exactement les minZoomLevel des polygon de MapLayersConfig.
 */
const ZOOM_TO_SOURCE_LAYER = [
  {
    minZoom: layersInfos.CITY.polygon.minZoomLevel,
    sourceLayerId: layersInfos.CITY.polygon.sourceLayerId,
  },
  {
    minZoom: layersInfos.COUNTY.polygon.minZoomLevel,
    sourceLayerId: layersInfos.COUNTY.polygon.sourceLayerId,
  },
  {
    minZoom: layersInfos.REGION.polygon.minZoomLevel,
    sourceLayerId: layersInfos.REGION.polygon.sourceLayerId,
  },
  {
    minZoom: layersInfos.COUNTRY.polygon.minZoomLevel,
    sourceLayerId: layersInfos.COUNTRY.polygon.sourceLayerId,
  },
].sort((a, b) => b.minZoom - a.minZoom);

const getSourceLayerForZoom = (zoom: number): string | null => {
  const match = ZOOM_TO_SOURCE_LAYER.find((entry) => zoom >= entry.minZoom);
  return match?.sourceLayerId ?? null;
};

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

  const sourceLayerId = getSourceLayerForZoom(zoom ?? 0);

  const longitude = mapCenter?.longitude ?? null;
  const latitude = mapCenter?.latitude ?? null;

  const fetchZoneDebounced = useAsyncDebouncedCallback(
    async (): Promise<void> => {
      if (
        mapView === null ||
        longitude === null ||
        latitude === null ||
        sourceLayerId === null
      ) {
        return;
      }
      try {
        const name = await getZoneFromLocation(
          mapView,
          longitude,
          latitude,
          sourceLayerId,
        );
        setZoneName(name);
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
  }, [fetchZoneDebounced, mapView, longitude, latitude, sourceLayerId]);

  return zoneName;
};
