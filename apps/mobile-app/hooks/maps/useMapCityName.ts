import { useAsyncDebouncedCallback } from "@tanstack/react-pacer";
import { useEffect, useState } from "react";

import { getZoneFromLocation } from "@/utils/getZoneFromLocation";
import { logger } from "@/utils/logger";
import {
  CITY_SOURCE_LAYER_ID,
  type MapZoneQueryContext,
} from "@/utils/map-zone";

export const useMapCityName = ({
  mapView,
  mapCenter,
}: MapZoneQueryContext): string | null => {
  const [cityName, setCityName] = useState<string | null>(null);

  const longitude = mapCenter?.longitude ?? null;
  const latitude = mapCenter?.latitude ?? null;

  const fetchCityNameDebounced = useAsyncDebouncedCallback(
    async (): Promise<void> => {
      if (mapView === null || longitude === null || latitude === null) {
        setCityName(null);
        return;
      }

      try {
        const cityNameResult = await getZoneFromLocation(
          mapView,
          longitude,
          latitude,
          CITY_SOURCE_LAYER_ID,
        );

        setCityName((currentCityName) => {
          return currentCityName === cityNameResult
            ? currentCityName
            : cityNameResult;
        });
      } catch (error) {
        logger("[useMapCityName] fetchCityName error:", error);
      }
    },
    { wait: 100 },
  );

  useEffect((): void => {
    void fetchCityNameDebounced();
  }, [fetchCityNameDebounced, latitude, longitude, mapView]);

  return cityName;
};
