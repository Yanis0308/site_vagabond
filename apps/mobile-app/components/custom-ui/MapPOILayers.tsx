import { CircleLayer, SymbolLayer } from "@rnmapbox/maps";
import { memo, type ReactElement } from "react";

import { type PoiType } from "@/utils/types";

interface MapPOILayersProps {
  sourceId: string;
  selectedPlace: PoiType | null;
  visitedPoiIds: string[];
}

// Constants for zoom-based sizing
const ZOOM_LEVELS = {
  MIN: 11,
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
  circleRadius: {
    [ZOOM_LEVELS.MIN]: { selected: 10, important: 4, other: 3 },
    // [ZOOM_LEVELS.MID]: { selected: 10, important: 8, other: 4 },
    [ZOOM_LEVELS.MAX]: { selected: 10, important: 8, other: 6 },
  },
  iconSize: {
    [ZOOM_LEVELS.MIN]: { selected: 0.5, important: 0.3, other: 0.1 },
    // [ZOOM_LEVELS.MID]: { selected: 0.6, important: 0.5, other: 0.3 },
    [ZOOM_LEVELS.MAX]: { selected: 0.5, important: 0.4, other: 0.3 },
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
const createSizeInterpolation = (
  sizeConfig: SizeConfig,
  selectedId: string,
  interpolationType: "exponential" | "linear" = "exponential",
) =>
  [
    "interpolate",
    // interpolationType === "exponential" ? ["exponential", 1.5] : ["linear"],
    ["linear"],
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

export const MapPOILayers = memo(
  ({
    sourceId,
    selectedPlace,
    visitedPoiIds,
  }: MapPOILayersProps): ReactElement => {
    return (
      <>
        {/* Couche pour tous les points avec tailles selon filter_level */}
        <CircleLayer
          id="all-points"
          sourceID={sourceId}
          sourceLayerID={POI_LAYER_CONFIG.sourceLayerId}
          minZoomLevel={POI_LAYER_CONFIG.minZoomLevel}
          // maxZoomLevel={POI_LAYER_CONFIG.maxZoomLevel}
          style={{
            circleColor: [
              "case",
              // Place sélectionnée - orange vif
              ["==", ["get", "poiId"], selectedPlace?.id ?? ""],
              "#f97316", // orange-500 - couleur distinctive pour la sélection
              // Points visités - vert
              ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
              "#22c55e", // green-500 pour les POIs visités
              // Points non visités - couleurs selon filter_level
              [
                "any",
                ["==", ["get", "filterLevel"], "STRICT"],
                ["==", ["get", "filterLevel"], "STANDARD"],
              ],
              "#7c3aed", // violet-600 - violet foncé pour les importants
              [
                "any",
                ["==", ["get", "filterLevel"], "LAXIST"],
                ["==", ["get", "filterLevel"], "INTERMEDIATE"],
              ],
              "#a855f7", // violet-500 - violet clair pour les moins importants
              // Couleur par défaut pour UNKNOWN
              "#6b7280", // gray-500 - gris pour les inconnus
            ],
            // Taille des points : priorité à la place sélectionnée, puis selon filter_level
            // Varie avec le niveau de zoom pour une meilleure visibilité
            circleRadius: createSizeInterpolation(
              SIZES.circleRadius,
              selectedPlace?.id ?? "",
            ),
            circleStrokeWidth: 1,
            circleStrokeColor: "#fff",

            // Priorité d'affichage : le point sélectionné a la priorité maximale
            circleSortKey: [
              "+",
              // PRIORITÉ MAXIMALE : Point sélectionné (+1000 points)
              [
                "case",
                ["==", ["get", "poiId"], selectedPlace?.id ?? ""],
                1000,
                0,
              ],
              // Bonus pour les POI visités (+100 points)
              [
                "case",
                ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
                100,
                0,
              ],
              // Bonus pour les niveaux de filtrage importants
              [
                "case",
                ["==", ["get", "filterLevel"], "STRICT"],
                90,
                ["==", ["get", "filterLevel"], "STANDARD"],
                80,
                ["==", ["get", "filterLevel"], "INTERMEDIATE"],
                70,
                ["==", ["get", "filterLevel"], "LAXIST"],
                60,
                0, // UNKNOWN ou autres
              ],
            ],
          }}
        />
        {/* Couche pour les icônes sur tous les points */}
        <SymbolLayer
          id="custom-marker-symbol"
          sourceID={sourceId}
          sourceLayerID={POI_LAYER_CONFIG.sourceLayerId}
          minZoomLevel={POI_LAYER_CONFIG.minZoomLevel}
          // maxZoomLevel={POI_LAYER_CONFIG.maxZoomLevel}
          style={{
            iconImage: [
              "case",
              // Si le POI est visité, afficher checkmark
              ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
              "checkmark",
              // Sinon afficher questionMark
              "questionMark",
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
          id="place-names"
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
  },
);

MapPOILayers.displayName = "MapPOILayers";
