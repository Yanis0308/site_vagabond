import { CircleLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { memo, type ReactElement } from "react";

import { type OnPressEvent } from "@/hooks/maps/useMapLogic";
import { type PoiType } from "@/utils/types";

interface MapPOILayersProps {
  customShape: GeoJSON.FeatureCollection;
  onPress: (event: OnPressEvent) => void;
  selectedPlace: PoiType | null;
}

export const MapPOILayers = memo(
  ({
    customShape,
    onPress,
    selectedPlace,
  }: MapPOILayersProps): ReactElement => {
    return (
      <ShapeSource id="pois" shape={customShape} onPress={onPress}>
        {/* Couche pour tous les points avec tailles selon filter_level */}
        <CircleLayer
          id="all-points"
          sourceID="pois"
          style={{
            circleColor: [
              "case",
              // Place sélectionnée - orange vif
              ["==", ["get", "id"], selectedPlace?.id ?? ""],
              "#f97316", // orange-500 - couleur distinctive pour la sélection
              // Points visités - transparents
              ["get", "isVisited"],
              "green", // Blanc transparent pour tous les visités
              // Points non visités - couleurs selon filter_level
              [
                "case",
                // STRICT/STANDARD non visités - violet foncé
                [
                  "any",
                  ["==", ["get", "filterLevel"], "STRICT"],
                  ["==", ["get", "filterLevel"], "STANDARD"],
                ],
                "#7c3aed", // violet-600 - violet foncé pour les importants
                // LAXIST/INTERMEDIATE non visités - violet clair
                [
                  "any",
                  ["==", ["get", "filterLevel"], "LAXIST"],
                  ["==", ["get", "filterLevel"], "INTERMEDIATE"],
                ],
                "#a855f7", // violet-500 - violet clair pour les moins importants
                // UNKNOWN non visités - gris
                "#6b7280", // gray-500 - gris pour les inconnus
              ],
            ],
            // Taille des points : priorité à la place sélectionnée, puis selon filter_level
            circleRadius: [
              "case",
              // Place sélectionnée - très gros point (16px)
              ["==", ["get", "id"], selectedPlace?.id ?? ""],
              16,
              // Points non visités - taille selon filter_level
              [
                "case",
                // STRICT et STANDARD - gros points (12px)
                [
                  "any",
                  ["==", ["get", "filterLevel"], "STRICT"],
                  ["==", ["get", "filterLevel"], "STANDARD"],
                ],
                12,
                // LAXIST et INTERMEDIATE - petits points (6px)
                [
                  "any",
                  ["==", ["get", "filterLevel"], "LAXIST"],
                  ["==", ["get", "filterLevel"], "INTERMEDIATE"],
                ],
                6,
                // UNKNOWN ou autres - taille moyenne (6px)
                6,
              ],
            ],
            circleStrokeWidth: 1,
            circleStrokeColor: "#fff",

            // Priorité d'affichage : les points visités ont la priorité
            circleSortKey: [
              "+",
              // Bonus pour les POI visités (+100 points)
              ["case", ["get", "isVisited"], 100, 0],
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
                50, // UNKNOWN ou autres
              ],
            ],
          }}
          minZoomLevel={12}
        />

        {/* Couche pour les emojis sur tous les points */}
        <SymbolLayer
          id="custom-marker-symbol"
          sourceID="pois"
          style={{
            iconImage: ["get", "iconName"],
            iconAllowOverlap: true,
            iconSize: [
              "case",
              // Place sélectionnée - très grande icône
              ["==", ["get", "id"], selectedPlace?.id ?? ""],
              0.8,
              // STRICT et STANDARD - grandes icônes (18px)
              [
                "any",
                ["==", ["get", "filterLevel"], "STRICT"],
                ["==", ["get", "filterLevel"], "STANDARD"],
              ],
              0.6,
              // LAXIST et INTERMEDIATE - petites icônes (14px)
              [
                "any",
                ["==", ["get", "filterLevel"], "LAXIST"],
                ["==", ["get", "filterLevel"], "INTERMEDIATE"],
              ],
              0.3,
              // UNKNOWN ou autres - taille moyenne (16px)
              0.3,
            ],
            // Priorité d'affichage
            symbolSortKey: [
              "+",
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
                50, // UNKNOWN ou autres
              ],
            ],
          }}
          minZoomLevel={12}
        />

        {/* Couche pour les noms des lieux - sans overlap */}
        <SymbolLayer
          id="place-names"
          sourceID="pois"
          style={{
            textField: ["get", "name"],
            textFont: ["Open Sans Semibold", "Arial Unicode MS Regular"],
            textSize: [
              "case",
              // Place sélectionnée - grande taille
              ["==", ["get", "id"], selectedPlace?.id ?? ""],
              14,
              // Points visités - taille fixe
              ["get", "isVisited"],
              12, // Taille fixe pour tous les lieux validés
              // Points non visités - taille selon filter_level
              [
                "case",
                // STRICT et STANDARD - grands noms (16px)
                [
                  "any",
                  ["==", ["get", "filterLevel"], "STRICT"],
                  ["==", ["get", "filterLevel"], "STANDARD"],
                ],
                12,
                // LAXIST et INTERMEDIATE - petits noms (12px)
                [
                  "any",
                  ["==", ["get", "filterLevel"], "LAXIST"],
                  ["==", ["get", "filterLevel"], "INTERMEDIATE"],
                ],
                10,
                // UNKNOWN - taille moyenne (14px)
                10,
              ],
            ],
            textColor: [
              "case",
              // Place sélectionnée - couleur orange
              ["==", ["get", "id"], selectedPlace?.id ?? ""],
              "#f97316", // orange-500 pour assortir avec le cercle
              // Autres places - couleur normale
              "#333333",
            ],
            textHaloColor: "#ffffff",
            textHaloWidth: 1,
            textAnchor: "top",
            textOffset: [0, 0.75], // Décalage vers le bas pour éviter le chevauchement avec l'icône
            textAllowOverlap: false, // Empêche l'overlap des noms
            textIgnorePlacement: false,
            textOptional: true, // Permet de masquer le texte si pas de place
            // Priorité d'affichage basée sur filter_level et statut visited
            symbolSortKey: [
              "+",
              // Bonus pour les POI visités
              ["case", ["get", "isVisited"], 0, 100],
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
          minZoomLevel={12} // Affiche les noms seulement à partir du zoom 12
        />
      </ShapeSource>
    );
  },
);

MapPOILayers.displayName = "MapPOILayers";
