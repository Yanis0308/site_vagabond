import {
  CircleLayer,
  LineLayer,
  SymbolLayer,
  VectorSource,
} from "@rnmapbox/maps";
import React, { memo, type ReactElement, useMemo } from "react";

import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import {
  type BoundaryLevelEnumType,
  type ZoneUserStatType,
} from "@/utils/types";

// Définition des couleurs pour les bulles par boundary level
const boundaryColors = {
  COUNTRY: "#8B5CF6", // Purple
  REGION: "#EF4444", // Red
  COUNTY: "#F59E0B", // Amber
  CITY: "#10B981", // Emerald
  DISTRICT: "#3B82F6", // Blue
  NEIGHBORHOOD: "#EC4899", // Pink
};

interface RemoteMapZonesLayersProps {
  tilesetUrl: string;
  showBoundaries?: boolean;
}

// Available data inside the tileset :
// boundary_level
// id
// importance_score
// is_capital
// name
// place_type
// population
// pois_count
// subzones_count
// way_area

// IMPORTANT: L'ordre des propriétés dans cet objet détermine l'ordre de rendu des couches.
// Les premières propriétés sont rendues en arrière-plan, les dernières au premier plan.
// Ordre actuel : NEIGHBORHOOD (fond) → DISTRICT → CITY → COUNTY → REGION → COUNTRY (premier plan)
// Cela permet aux zones plus petites d'être visibles par-dessus les zones plus grandes.
const layersInfos: Record<
  BoundaryLevelEnumType,
  {
    textAndPoint: {
      sourceLayerId: string;
      circleId: string;
      symbolLayerId: string;
      minZoomLevel: number;
      maxZoomLevel: number;
    };
    polygon: {
      sourceLayerId: string;
      polygonLayerId: string;
      minZoomLevel: number;
      maxZoomLevel: number;
    };
  }
> = {
  NEIGHBORHOOD: {
    textAndPoint: {
      sourceLayerId: "neighborhood-data-layer-v1",
      circleId: "neighborhood-boundaries-circles",
      symbolLayerId: "neighborhood-boundaries-labels",
      minZoomLevel: 10,
      maxZoomLevel: 18,
    },
    polygon: {
      sourceLayerId: "neighborhood-polygon-layer-v1",
      polygonLayerId: "neighborhood-boundaries-lines",
      minZoomLevel: 10,
      maxZoomLevel: 18,
    },
  },
  DISTRICT: {
    textAndPoint: {
      sourceLayerId: "district-data-layer-v1",
      circleId: "district-boundaries-circles",
      symbolLayerId: "district-boundaries-labels",
      minZoomLevel: 10,
      maxZoomLevel: 16,
    },
    polygon: {
      sourceLayerId: "district-polygon-layer-v1",
      polygonLayerId: "district-boundaries-lines",
      minZoomLevel: 10,
      maxZoomLevel: 16,
    },
  },
  CITY: {
    textAndPoint: {
      sourceLayerId: "city-data-layer-v1",
      circleId: "city-boundaries-circles",
      symbolLayerId: "city-boundaries-labels",
      minZoomLevel: 8,
      maxZoomLevel: 16,
    },
    polygon: {
      sourceLayerId: "city-polygon-layer-v1",
      polygonLayerId: "city-boundaries-lines",
      minZoomLevel: 8,
      maxZoomLevel: 16,
    },
  },
  COUNTY: {
    textAndPoint: {
      sourceLayerId: "county-data-layer-v1",
      circleId: "county-boundaries-circles",
      symbolLayerId: "county-boundaries-labels",
      minZoomLevel: 7,
      maxZoomLevel: 10,
    },
    polygon: {
      sourceLayerId: "county-polygon-layer-v1",
      polygonLayerId: "county-boundaries-lines",
      minZoomLevel: 7,
      maxZoomLevel: 10,
    },
  },
  REGION: {
    textAndPoint: {
      sourceLayerId: "region-data-layer-v1",
      circleId: "region-boundaries-circles",
      symbolLayerId: "region-boundaries-labels",
      minZoomLevel: 5,
      maxZoomLevel: 10,
    },
    polygon: {
      sourceLayerId: "region-polygon-layer-v1",
      polygonLayerId: "region-boundaries-lines",
      minZoomLevel: 5,
      maxZoomLevel: 10,
    },
  },
  COUNTRY: {
    textAndPoint: {
      sourceLayerId: "country-data-layer-v1",
      circleId: "country-boundaries-circles",
      symbolLayerId: "country-boundaries-labels",
      minZoomLevel: 0,
      maxZoomLevel: 7,
    },
    polygon: {
      sourceLayerId: "country-polygon-layer-v1",
      polygonLayerId: "country-boundaries-lines",
      minZoomLevel: 0,
      maxZoomLevel: 7,
    },
  },
};

export const RemoteMapZonesLayers = memo(
  ({
    tilesetUrl,
    showBoundaries = true,
  }: RemoteMapZonesLayersProps): ReactElement => {
    const { data: userZoneStats } = useUserZoneStats();

    const completionData = React.useMemo(() => {
      return (
        userZoneStats?.reduce<Record<string, ZoneUserStatType>>((acc, zone) => {
          // Transformer l'ID de OSM-R-3219086 vers R-3219086
          const formattedZoneId = zone.zone_id.replace("OSM-", "");
          acc[formattedZoneId] = zone;
          return acc;
        }, {}) ?? undefined
      );
    }, [userZoneStats]);
    // Style pour les cercles basé uniquement sur le boundary level
    const circleStyle: Record<string, unknown> = React.useMemo(() => {
      return {
        circleRadius: 3,
        circleColor: [
          "case",
          ["==", ["get", "boundary_level"], "COUNTRY"],
          boundaryColors.COUNTRY,
          ["==", ["get", "boundary_level"], "REGION"],
          boundaryColors.REGION,
          ["==", ["get", "boundary_level"], "COUNTY"],
          boundaryColors.COUNTY,
          ["==", ["get", "boundary_level"], "CITY"],
          boundaryColors.CITY,
          ["==", ["get", "boundary_level"], "DISTRICT"],
          boundaryColors.DISTRICT,
          ["==", ["get", "boundary_level"], "NEIGHBORHOOD"],
          boundaryColors.NEIGHBORHOOD,
          boundaryColors.CITY, // fallback
        ],
        circleStrokeWidth: 2,
        circleStrokeColor: "#FFFFFF",
        circleOpacity: 0.8,
        circleStrokeOpacity: 1,
      };
    }, []);

    // Style pour les contours polygonaux (LineLayer)
    const lineStyle: Record<string, unknown> = React.useMemo(() => {
      return {
        lineColor: [
          "case",
          ["==", ["get", "boundary_level"], "COUNTRY"],
          boundaryColors.COUNTRY,
          ["==", ["get", "boundary_level"], "REGION"],
          boundaryColors.REGION,
          ["==", ["get", "boundary_level"], "COUNTY"],
          boundaryColors.COUNTY,
          ["==", ["get", "boundary_level"], "CITY"],
          boundaryColors.CITY,
          ["==", ["get", "boundary_level"], "DISTRICT"],
          boundaryColors.DISTRICT,
          ["==", ["get", "boundary_level"], "NEIGHBORHOOD"],
          boundaryColors.NEIGHBORHOOD,
          boundaryColors.CITY, // fallback
        ],
        lineWidth: showBoundaries
          ? [
              "case",
              ["==", ["get", "boundary_level"], "COUNTRY"],
              3, // Plus épais pour les pays
              ["==", ["get", "boundary_level"], "REGION"],
              2.5,
              ["==", ["get", "boundary_level"], "COUNTY"],
              2,
              ["==", ["get", "boundary_level"], "CITY"],
              1.5,
              ["==", ["get", "boundary_level"], "DISTRICT"],
              1.2,
              ["==", ["get", "boundary_level"], "NEIGHBORHOOD"],
              1,
              1.5, // fallback
            ]
          : 0, // Invisible si showBoundaries est false
        lineOpacity: 0.8,
      };
    }, [showBoundaries]);

    // Style pour les textes avec informations combinées
    const largeBoxTextStyle: Record<string, unknown> = React.useMemo(() => {
      if (completionData === undefined) {
        return {
          textField: "",
        };
      }

      // Construire l'expression conditionnelle pour textField avec les données de completion
      const textExpression: unknown[] = ["case"];

      // Ajouter les conditions pour les zones avec des stats utilisateur
      Object.entries(completionData).forEach(([zoneId, zone]) => {
        // Construire le texte d'affichage : ligne 1 nom, ligne 2 zones, ligne 3 pois
        let displayText = zone.name;

        // Ligne 2 : zones x/y et % zones
        if (zone.total_subzones_count > 0) {
          let zonesPercent = Math.ceil(
            (zone.completed_subzones_count / zone.total_subzones_count) * 100,
          );
          // Minimum 1% si au moins une zone est complétée
          if (zone.completed_subzones_count > 0 && zonesPercent === 0) {
            zonesPercent = 1;
          }

          if (zonesPercent > 0) {
            displayText += `\n${zone.completed_subzones_count}/${zone.total_subzones_count} zones ${zonesPercent}%`;
          } else {
            displayText += `\n${zone.completed_subzones_count}/${zone.total_subzones_count} zones`;
          }
        }

        // Ligne 3 : pois x/y et % pois (seulement pour CITY, DISTRICT, NEIGHBORHOOD)
        const shouldShowPoisStats = [
          "CITY",
          "DISTRICT",
          "NEIGHBORHOOD",
        ].includes(zone.boundary_level);
        if (shouldShowPoisStats && zone.total_pois_count > 0) {
          let poisPercent = Math.ceil(
            (zone.validated_pois_count / zone.total_pois_count) * 100,
          );
          // Minimum 1% si au moins un poi est validé
          if (zone.validated_pois_count > 0 && poisPercent === 0) {
            poisPercent = 1;
          }

          if (poisPercent > 0) {
            displayText += `\n${zone.validated_pois_count}/${zone.total_pois_count} points ${poisPercent}%`;
          } else {
            displayText += `\n${zone.validated_pois_count}/${zone.total_pois_count} points`;
          }
        }

        textExpression.push(["==", ["get", "id"], zoneId], displayText);
      });

      // Valeur par défaut pour les zones sans completion data - utiliser les données du layer
      const defaultTextExpression = [
        "case",
        // Si subzones_count > 0 et pois_count > 0 ET niveau autorisé pour POIs
        [
          "all",
          [">", ["get", "subzones_count"], 0],
          [">", ["get", "pois_count"], 0],
          [
            "in",
            ["get", "boundary_level"],
            ["literal", ["CITY", "DISTRICT", "NEIGHBORHOOD"]],
          ],
        ],
        [
          "concat",
          ["get", "name"],
          "\n0/",
          ["to-string", ["get", "subzones_count"]],
          " zones\n0/",
          ["to-string", ["get", "pois_count"]],
          " lieux",
        ],
        // Si seulement subzones_count > 0
        [">", ["get", "subzones_count"], 0],
        [
          "concat",
          ["get", "name"],
          "\n0/",
          ["to-string", ["get", "subzones_count"]],
          " zones",
        ],
        // Si seulement pois_count > 0 ET niveau autorisé pour POIs
        [
          "all",
          [">", ["get", "pois_count"], 0],
          [
            "in",
            ["get", "boundary_level"],
            ["literal", ["CITY", "DISTRICT", "NEIGHBORHOOD"]],
          ],
        ],
        [
          "concat",
          ["get", "name"],
          "\n0/",
          ["to-string", ["get", "pois_count"]],
          " lieux",
        ],
        // Sinon, juste le nom
        ["get", "name"],
      ];

      textExpression.push(defaultTextExpression);

      return {
        textField: textExpression,
        textPadding: 12, // Plus de padding
        textHaloBlur: 3, // Effet plus doux avec un halo plus large
        symbolPlacement: "point",
        textAllowOverlap: false,
        textIgnorePlacement: false,
        symbolSortKey: ["-", ["get", "pois_count"]],
        textFont: ["literal", ["Open Sans Semibold", "Arial Unicode MS Bold"]],
        textSize: 12,
        textColor: "#FFFFFF",
        // Couleur du gros encart selon le boundary level
        textHaloColor: [
          "case",
          ["==", ["get", "boundary_level"], "COUNTRY"],
          boundaryColors.COUNTRY,
          ["==", ["get", "boundary_level"], "REGION"],
          boundaryColors.REGION,
          ["==", ["get", "boundary_level"], "COUNTY"],
          boundaryColors.COUNTY,
          ["==", ["get", "boundary_level"], "CITY"],
          boundaryColors.CITY,
          ["==", ["get", "boundary_level"], "DISTRICT"],
          boundaryColors.DISTRICT,
          ["==", ["get", "boundary_level"], "NEIGHBORHOOD"],
          boundaryColors.NEIGHBORHOOD,
          boundaryColors.CITY, // fallback
        ],
        textHaloWidth: 28,
        textAnchor: "center",
        textOpacity: 1,
      };
    }, [completionData]);

    const allLayers = useMemo(() => {
      const layers: ReactElement[] = [];

      Object.values(layersInfos).forEach((layer, index) => {
        // LineLayer d'abord (arrière-plan)
        layers.push(
          <LineLayer
            key={`line-${index}`}
            id={layer.polygon.polygonLayerId}
            sourceLayerID={layer.polygon.sourceLayerId}
            minZoomLevel={layer.polygon.minZoomLevel}
            maxZoomLevel={layer.polygon.maxZoomLevel}
            style={lineStyle}
          />,
        );

        // CircleLayer ensuite
        layers.push(
          <CircleLayer
            key={`circle-${index}`}
            id={layer.textAndPoint.circleId}
            sourceLayerID={layer.textAndPoint.sourceLayerId}
            minZoomLevel={layer.textAndPoint.minZoomLevel}
            maxZoomLevel={layer.textAndPoint.maxZoomLevel}
            style={circleStyle}
          />,
        );

        // SymbolLayer en dernier (premier plan)
        layers.push(
          <SymbolLayer
            key={`symbol-${index}`}
            id={layer.textAndPoint.symbolLayerId}
            sourceLayerID={layer.textAndPoint.sourceLayerId}
            minZoomLevel={layer.textAndPoint.minZoomLevel}
            maxZoomLevel={layer.textAndPoint.maxZoomLevel}
            style={largeBoxTextStyle}
          />,
        );
      });

      return layers;
    }, [circleStyle, largeBoxTextStyle, lineStyle]);

    return (
      <VectorSource id="remote-boundaries-source" url={tilesetUrl}>
        {/* Line Layers - Contours des zones (rendered first = background) */}
        {allLayers}
      </VectorSource>
    );
  },
);

RemoteMapZonesLayers.displayName = "RemoteMapZonesLayers";
