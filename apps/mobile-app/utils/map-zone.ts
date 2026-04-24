import { type MapView } from "@rnmapbox/maps";

import { layersInfos } from "@/constants/MapLayersConfig";

export type RelevantZoneName = "city" | "county" | "region" | "country";

export interface MapZoneQueryContext {
  mapView: MapView | null;
  mapCenter: { longitude: number; latitude: number } | null;
}

export interface MapZoneLayerConfig {
  zoneName: RelevantZoneName;
  minZoom: number;
  sourceLayerId: string;
}

export const MAP_ZONE_LAYER_CONFIGS = [
  {
    zoneName: "city",
    minZoom: 12,
    sourceLayerId: layersInfos.CITY.polygon.sourceLayerId,
  },
  {
    zoneName: "county",
    minZoom: 8,
    sourceLayerId: layersInfos.COUNTY.polygon.sourceLayerId,
  },
  {
    zoneName: "region",
    minZoom: 6,
    sourceLayerId: layersInfos.REGION.polygon.sourceLayerId,
  },
  {
    zoneName: "country",
    minZoom: 0,
    sourceLayerId: layersInfos.COUNTRY.polygon.sourceLayerId,
  },
] satisfies MapZoneLayerConfig[];

export const CITY_SOURCE_LAYER_ID = layersInfos.CITY.polygon.sourceLayerId;

export const getSourceLayerForZoom = (zoom: number): string | null => {
  const match = MAP_ZONE_LAYER_CONFIGS.find((entry) => zoom >= entry.minZoom);
  return match?.sourceLayerId ?? null;
};

export const getRelevantZoneNameForZoom = (zoom: number): RelevantZoneName => {
  const match = MAP_ZONE_LAYER_CONFIGS.find((entry) => zoom >= entry.minZoom);
  return match?.zoneName ?? "country";
};
