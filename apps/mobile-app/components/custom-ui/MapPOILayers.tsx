import { SymbolLayer } from "@rnmapbox/maps";
import { type ReactElement } from "react";

import { MAP_LAYER_IDS } from "@/constants/MapLayerIds";
import { type PoiType } from "@/utils/types";

interface MapPOILayersProps {
  sourceId: string;
  selectedPlace: PoiType | null;
  visitedPoiIds: string[];
}

// Constants for zoom-based sizing
const ZOOM_LEVELS = {
  MIN: 10,
  // MID: 12.5,
  MAX: 13,
} as const;

// POI layer configuration
const POI_LAYER_CONFIG = {
  sourceLayerId: "pois-data-layer-v1",
  minZoomLevel: 10,
  // maxZoomLevel: 22,
} as const;

// Helper to create filter level condition
const createFilterLevelCondition = () =>
  [
    "any",
    ["==", ["get", "filterLevel"], "STRICT"],
    ["==", ["get", "filterLevel"], "STANDARD"],
  ] as const;

// Size configurations by zoom level
const SIZES = {
  iconSize: {
    [ZOOM_LEVELS.MIN]: { selected: 0.07, important: 0.02, other: 0.01 },
    [ZOOM_LEVELS.MAX]: { selected: 0.07, important: 0.06, other: 0.035 },
  },
  textSize: {
    [ZOOM_LEVELS.MIN]: { selected: 14, important: 8, other: 6 },
    // [ZOOM_LEVELS.MID]: {
    //   selected: 12,
    //   important: 11,
    //   other: 9,
    // },
    [ZOOM_LEVELS.MAX]: {
      selected: 14,
      important: 12,
      other: 10,
    },
  },
} as const;

// Type for size configuration
type SizeConfig = Record<
  (typeof ZOOM_LEVELS)[keyof typeof ZOOM_LEVELS],
  {
    selected: number;
    important: number;
    other: number;
  }
>;

// Helper to create size interpolation for circle/icon
const createSizeInterpolation = (sizeConfig: SizeConfig, selectedId: string) =>
  [
    "interpolate",
    ["exponential", 2],
    ["zoom"],
    ZOOM_LEVELS.MIN,
    [
      "case",
      ["==", ["get", "poiId"], selectedId],
      sizeConfig[ZOOM_LEVELS.MIN].selected,
      createFilterLevelCondition(),
      sizeConfig[ZOOM_LEVELS.MIN].important,
      sizeConfig[ZOOM_LEVELS.MIN].other,
    ],
    // ZOOM_LEVELS.MID,
    // [
    //   "case",
    //   ["==", ["get", "poiId"], selectedId],
    //   sizeConfig[ZOOM_LEVELS.MID].selected,
    //   createFilterLevelCondition(),
    //   sizeConfig[ZOOM_LEVELS.MID].important,
    //   sizeConfig[ZOOM_LEVELS.MID].other,
    // ],
    ZOOM_LEVELS.MAX,
    [
      "case",
      ["==", ["get", "poiId"], selectedId],
      sizeConfig[ZOOM_LEVELS.MAX].selected,
      createFilterLevelCondition(),
      sizeConfig[ZOOM_LEVELS.MAX].important,
      sizeConfig[ZOOM_LEVELS.MAX].other,
    ],
  ] as const;

// Helper to create text size interpolation
const createTextSizeInterpolation = (selectedId: string) =>
  [
    "interpolate",
    ["linear"],
    ["zoom"],
    ZOOM_LEVELS.MIN,
    [
      "case",
      ["==", ["get", "poiId"], selectedId],
      SIZES.textSize[ZOOM_LEVELS.MIN].selected,
      createFilterLevelCondition(),
      SIZES.textSize[ZOOM_LEVELS.MIN].important,
      SIZES.textSize[ZOOM_LEVELS.MIN].other,
    ],
    // ZOOM_LEVELS.MID,
    // [
    //   "case",
    //   ["==", ["get", "poiId"], selectedId],
    //   // SIZES.textSize[ZOOM_LEVELS.MID].selected,
    //   createFilterLevelCondition(),
    //   // SIZES.textSize[ZOOM_LEVELS.MID].important,
    //   // SIZES.textSize[ZOOM_LEVELS.MID].other,
    // ],
    ZOOM_LEVELS.MAX,
    [
      "case",
      ["==", ["get", "poiId"], selectedId],
      SIZES.textSize[ZOOM_LEVELS.MAX].selected,
      createFilterLevelCondition(),
      SIZES.textSize[ZOOM_LEVELS.MAX].important,
      SIZES.textSize[ZOOM_LEVELS.MAX].other,
    ],
  ] as const;

export const MapPOILayers = ({
  sourceId,
  selectedPlace,
  visitedPoiIds,
}: MapPOILayersProps): ReactElement => {
  return (
    <>
      {/* Couche pour les icônes sur tous les points */}
      <SymbolLayer
        id={MAP_LAYER_IDS.POI_ICONS}
        sourceID={sourceId}
        sourceLayerID={POI_LAYER_CONFIG.sourceLayerId}
        minZoomLevel={POI_LAYER_CONFIG.minZoomLevel}
        // maxZoomLevel={POI_LAYER_CONFIG.maxZoomLevel}
        style={{
          // Category icons from Mapbox Studio: {category}-bw-v1 (unvisited) / {category}-color-v1 (visited)
          // Maps mainCategory to icon name: place_of_worship→religion, small_monument→small-monument, fallback→attraction
          iconImage: [
            "concat",
            [
              "coalesce",
              [
                "match",
                ["get", "mainCategory"],
                "place_of_worship",
                "religion",
                "small_monument",
                "small-monument",
                ["get", "mainCategory"],
              ],
              "attraction",
            ],
            [
              "case",
              ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
              "-color-v1",
              "-bw-v1",
            ],
          ],
          iconAllowOverlap: true,
          iconSize: createSizeInterpolation(
            SIZES.iconSize,
            selectedPlace?.id ?? "",
          ),
          // Priorité d'affichage : le point sélectionné a la priorité maximale
          symbolSortKey: [
            "+",
            // PRIORITÉ MAXIMALE : Point sélectionné (-1000 points)
            [
              "case",
              ["==", ["get", "poiId"], selectedPlace?.id ?? ""],
              -1000,
              0,
            ],
            // Bonus pour les POI visités
            ["case", ["get", "isVisited"], 0, 100],
            // Bonus pour les niveaux de filtrage importants
            [
              "case",
              ["==", ["get", "filterLevel"], "STRICT"],
              10,
              ["==", ["get", "filterLevel"], "STANDARD"],
              20,
              ["==", ["get", "filterLevel"], "INTERMEDIATE"],
              30,
              ["==", ["get", "filterLevel"], "LAXIST"],
              40,
              0, // UNKNOWN ou autres
            ],
          ],
        }}
      />
      {/* Couche pour les noms des lieux - sans overlap */}
      <SymbolLayer
        id={MAP_LAYER_IDS.POI_LABELS}
        sourceID={sourceId}
        sourceLayerID={POI_LAYER_CONFIG.sourceLayerId}
        minZoomLevel={POI_LAYER_CONFIG.minZoomLevel}
        // maxZoomLevel={POI_LAYER_CONFIG.maxZoomLevel}
        style={{
          textField: ["get", "name"],
          textFont: ["Open Sans Semibold", "Arial Unicode MS Regular"],
          textSize: createTextSizeInterpolation(selectedPlace?.id ?? ""),
          textColor: [
            "case",
            // Place sélectionnée - couleur orange
            ["==", ["get", "poiId"], selectedPlace?.id ?? ""],
            "#f97316", // orange-500 pour assortir avec le cercle
            // Autres places - couleur normale
            "#333333",
          ],
          textHaloColor: "#ffffff",
          textHaloWidth: 1,
          textAnchor: "top",
          textOffset: [0, 0.75], // Décalage vers le bas pour éviter le chevauchement avec l'icône
          textAllowOverlap: false, // Les textes ne se chevauchent pas
          textIgnorePlacement: false,
          textOptional: true, // Permet de masquer le texte si pas de place
          // Priorité d'affichage : le point sélectionné a la priorité maximale
          symbolSortKey: [
            "+",
            // PRIORITÉ MAXIMALE : Point sélectionné (-1000 points)
            [
              "case",
              ["==", ["get", "poiId"], selectedPlace?.id ?? ""],
              -1000,
              0,
            ],
            // Bonus pour les POI visités
            [
              "case",
              ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
              0,
              100,
            ],
            // Bonus pour les niveaux de filtrage importants
            [
              "case",
              ["==", ["get", "filterLevel"], "STRICT"],
              0,
              ["==", ["get", "filterLevel"], "STANDARD"],
              10,
              ["==", ["get", "filterLevel"], "INTERMEDIATE"],
              20,
              ["==", ["get", "filterLevel"], "LAXIST"],
              30,
              40, // UNKNOWN ou autres
            ],
          ],
        }}
      />
    </>
  );
};

MapPOILayers.displayName = "MapPOILayers";
