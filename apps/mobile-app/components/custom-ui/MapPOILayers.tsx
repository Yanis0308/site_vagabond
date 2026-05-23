import { SymbolLayer } from "@rnmapbox/maps";
import { type ReactElement } from "react";

import { MAP_LAYER_IDS } from "@/constants/MapLayerIds";
import { MAP_SOURCE_LAYER_IDS } from "@/constants/MapSources";
import { type PoiType } from "@/utils/types";

interface MapPOILayersProps {
  sourceId: string;
  selectedPlace: PoiType | null;
}

// Constants for zoom-based sizing
const ZOOM_LEVELS = {
  MIN: 10,
  // MID: 12.5,
  MAX: 13,
} as const;

// POI layer configuration
const POI_LAYER_CONFIG = {
  sourceLayerId: MAP_SOURCE_LAYER_IDS.POIS_DATA,
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

// VG-471 — feature-state interdit dans iconImage (layout property). Solution :
// 2 SymbolLayer superposées sur la même VectorSource, l'une `-color-v1` rendue
// quand visited, l'autre `-bw-v1` rendue quand !visited. La bascule passe par
// iconOpacity (paint property) qui, lui, accepte feature-state. iconAllowOverlap
// reste true sur les deux (cohérent avec le comportement existant).
const isVisitedExpr = ["boolean", ["feature-state", "visited"], false];

const buildIconImageExpr = (suffix: "-color-v1" | "-bw-v1"): unknown[] => [
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
  suffix,
];

export const MapPOILayers = ({
  sourceId,
  selectedPlace,
}: MapPOILayersProps): ReactElement => {
  // symbolSortKey est une layout property : feature-state y est interdit, donc
  // le tri ne peut pas dépendre du statut visited. Le sortKey reste piloté par
  // la sélection (-1000) et le filterLevel.
  const symbolSortKey = [
    "+",
    ["case", ["==", ["get", "poiId"], selectedPlace?.id ?? ""], -1000, 0],
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
      0,
    ],
  ];

  const commonLayerProps = {
    sourceID: sourceId,
    sourceLayerID: POI_LAYER_CONFIG.sourceLayerId,
    minZoomLevel: POI_LAYER_CONFIG.minZoomLevel,
  };

  const iconCommonStyle = {
    iconAllowOverlap: true,
    iconSize: createSizeInterpolation(SIZES.iconSize, selectedPlace?.id ?? ""),
    symbolSortKey,
  };

  return (
    <>
      {/* Couche couleur : rendue quand feature-state visited === true */}
      <SymbolLayer
        id={MAP_LAYER_IDS.POI_ICONS_COLOR}
        {...commonLayerProps}
        style={{
          ...iconCommonStyle,
          iconImage: buildIconImageExpr("-color-v1"),
          iconOpacity: ["case", isVisitedExpr, 1, 0],
        }}
      />
      {/* Couche N&B : rendue quand feature-state visited === false */}
      <SymbolLayer
        id={MAP_LAYER_IDS.POI_ICONS_BW}
        {...commonLayerProps}
        style={{
          ...iconCommonStyle,
          iconImage: buildIconImageExpr("-bw-v1"),
          iconOpacity: ["case", isVisitedExpr, 0, 1],
        }}
      />
      {/* Couche pour les noms des lieux - sans overlap */}
      <SymbolLayer
        id={MAP_LAYER_IDS.POI_LABELS}
        {...commonLayerProps}
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
          textOptional: true,
          symbolSortKey: [
            "+",
            [
              "case",
              ["==", ["get", "poiId"], selectedPlace?.id ?? ""],
              -1000,
              0,
            ],
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
              40,
            ],
          ],
        }}
      />
    </>
  );
};

MapPOILayers.displayName = "MapPOILayers";
