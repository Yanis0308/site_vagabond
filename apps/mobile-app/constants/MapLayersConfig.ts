import type { BoundaryLevelEnum } from "@vagabond/shared-utils";

import { MAP_LAYER_IDS } from "./MapLayerIds";

// Seuil de POIs : villes avec >= CITY_POI_COUNT_THRESHOLD POIs apparaissent dès CITY_LOW_POI_MIN_ZOOM.
// Les autres attendent CITY_ALL_POIS_MIN_ZOOM. Utiliser minZoomLevel (prop natif float) plutôt
const CITY_POI_COUNT_THRESHOLD = 10;
const CITY_HIGH_POI_MIN_ZOOM = 8; // villes avec >= 10 POIs : dès le zoom 8
const CITY_LOW_POI_MIN_ZOOM = 9.5; // villes avec < 10 POIs (> 0) : dès le zoom 9.5

// IMPORTANT: L'ordre des propriétés dans cet objet détermine l'ordre de rendu des couches.
// Les premières propriétés sont rendues en arrière-plan, les dernières au premier plan.
// Ordre actuel : NEIGHBORHOOD (fond) → DISTRICT → CITY → COUNTY → REGION → COUNTRY (premier plan)
// Cela permet aux zones plus petites d'être visibles par-dessus les zones plus grandes.
interface TextAndPointLayerConfig {
  sourceLayerId: string;
  symbolLayerId: string;
  minZoomLevel: number;
  maxZoomLevel: number;
  /** Filtre Mapbox optionnel appliqué en plus du filtre de base du boundary level */
  filter?: unknown[];
  /** Suffixe ajouté à symbolLayerId pour former un ID de layer unique lors de la duplication */
  layerKey?: string;
}

export const layersInfos: Record<
  BoundaryLevelEnum,
  {
    textAndPoint: TextAndPointLayerConfig | TextAndPointLayerConfig[];
    polygon: {
      sourceLayerId: string;
      polygonLayerId: string;
      minZoomLevel: number;
      maxZoomLevel: number;
    };
    fillBackground: {
      sourceLayerId: string;
      fillLayerId: string;
      minZoomLevel: number;
      maxZoomLevel: number;
    };
  }
> = {
  NEIGHBORHOOD: {
    textAndPoint: {
      sourceLayerId: "neighborhood-data-layer-v1",
      symbolLayerId: MAP_LAYER_IDS.NEIGHBORHOOD_LABELS,
      minZoomLevel: 22, // never
      maxZoomLevel: 22, // never
    },
    polygon: {
      sourceLayerId: "neighborhood-polygon-layer-v1",
      polygonLayerId: MAP_LAYER_IDS.NEIGHBORHOOD_LINES,
      minZoomLevel: 22, // never
      maxZoomLevel: 22, // never
    },
    fillBackground: {
      sourceLayerId: "neighborhood-polygon-layer-v1",
      fillLayerId: MAP_LAYER_IDS.NEIGHBORHOOD_FILL,
      minZoomLevel: 22, // never
      maxZoomLevel: 22, // never
    },
  },
  DISTRICT: {
    textAndPoint: {
      sourceLayerId: "district-data-layer-v1",
      symbolLayerId: MAP_LAYER_IDS.DISTRICT_LABELS,
      minZoomLevel: 9, // start during city
      maxZoomLevel: 22, // to max zoom
    },
    polygon: {
      sourceLayerId: "district-polygon-layer-v1",
      polygonLayerId: MAP_LAYER_IDS.DISTRICT_LINES,
      minZoomLevel: 9, // start during city
      maxZoomLevel: 22, // never
    },
    fillBackground: {
      sourceLayerId: "district-polygon-layer-v1",
      fillLayerId: MAP_LAYER_IDS.DISTRICT_FILL,
      minZoomLevel: 22, // never
      maxZoomLevel: 22, // never
    },
  },
  CITY: {
    textAndPoint: [
      {
        sourceLayerId: "city-data-layer-v1",
        symbolLayerId: MAP_LAYER_IDS.CITY_LABELS,
        minZoomLevel: CITY_HIGH_POI_MIN_ZOOM, // villes avec >= 10 POIs (dès le zoom 8)
        maxZoomLevel: 22,
        filter: [">=", ["get", "pois_count"], CITY_POI_COUNT_THRESHOLD],
        layerKey: "all-pois",
      },
      {
        sourceLayerId: "city-data-layer-v1",
        symbolLayerId: MAP_LAYER_IDS.CITY_LABELS,
        minZoomLevel: CITY_LOW_POI_MIN_ZOOM, // villes avec < 10 POIs (dès le zoom 9.5)
        maxZoomLevel: 22,
        filter: [
          "all",
          [">", ["get", "pois_count"], 0],
          ["<", ["get", "pois_count"], CITY_POI_COUNT_THRESHOLD],
        ],
        layerKey: "low-pois",
      },
    ],
    polygon: {
      sourceLayerId: "city-polygon-layer-v1",
      polygonLayerId: MAP_LAYER_IDS.CITY_LINES,
      minZoomLevel: 8, // start after county
      maxZoomLevel: 22, // never
    },
    fillBackground: {
      sourceLayerId: "city-polygon-layer-v1",
      fillLayerId: MAP_LAYER_IDS.CITY_FILL,
      minZoomLevel: 8, // start after county
      maxZoomLevel: 10, // end before voronoi zones (pois)
    },
  },
  COUNTY: {
    textAndPoint: {
      sourceLayerId: "county-data-layer-v1",
      symbolLayerId: MAP_LAYER_IDS.COUNTY_LABELS,
      minZoomLevel: 6, // start after region
      maxZoomLevel: 8, // end before city
    },
    polygon: {
      sourceLayerId: "county-polygon-layer-v1",
      polygonLayerId: MAP_LAYER_IDS.COUNTY_LINES,
      minZoomLevel: 6, // start after region
      maxZoomLevel: 10, // end before pois
    },
    fillBackground: {
      sourceLayerId: "county-polygon-layer-v1",
      fillLayerId: MAP_LAYER_IDS.COUNTY_FILL,
      minZoomLevel: 6, // start after region
      maxZoomLevel: 8, // end before city
    },
  },
  REGION: {
    textAndPoint: {
      sourceLayerId: "region-data-layer-v1",
      symbolLayerId: MAP_LAYER_IDS.REGION_LABELS,
      minZoomLevel: 4, // start after country
      maxZoomLevel: 6, // end before county
    },
    polygon: {
      sourceLayerId: "region-polygon-layer-v1",
      polygonLayerId: MAP_LAYER_IDS.REGION_LINES,
      minZoomLevel: 4, // start after country
      maxZoomLevel: 8, // end before city
    },
    fillBackground: {
      sourceLayerId: "region-polygon-layer-v1",
      fillLayerId: MAP_LAYER_IDS.REGION_FILL,
      minZoomLevel: 4, // start after country
      maxZoomLevel: 6, // end before county
    },
  },
  COUNTRY: {
    textAndPoint: {
      sourceLayerId: "country-data-layer-v1",
      symbolLayerId: MAP_LAYER_IDS.COUNTRY_LABELS,
      minZoomLevel: 0, // never
      maxZoomLevel: 4, // end before region
    },
    polygon: {
      sourceLayerId: "country-polygon-layer-v1",
      polygonLayerId: MAP_LAYER_IDS.COUNTRY_LINES,
      minZoomLevel: 0, // never
      maxZoomLevel: 4, // end before region
    },
    fillBackground: {
      sourceLayerId: "country-polygon-layer-v1",
      fillLayerId: MAP_LAYER_IDS.COUNTRY_FILL,
      minZoomLevel: 22, // never
      maxZoomLevel: 22, // never
    },
  },
};
