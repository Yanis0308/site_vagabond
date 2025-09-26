import { CircleLayer, SymbolLayer, VectorSource } from "@rnmapbox/maps";
import React, { memo, type ReactElement } from "react";

import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import { type ZoneUserStatType } from "@/utils/types";

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

const zoomLevels = {
  COUNTRY: {
    minZoomLevel: 0,
    maxZoomLevel: 7,
  },
  REGION: {
    minZoomLevel: 5,
    maxZoomLevel: 10,
  },
  COUNTY: {
    minZoomLevel: 7,
    maxZoomLevel: 10,
  },
  CITY: {
    minZoomLevel: 8,
    maxZoomLevel: 10,
  },
  DISTRICT: {
    minZoomLevel: 9,
    maxZoomLevel: 10,
  },
  NEIGHBORHOOD: {
    minZoomLevel: 10,
    maxZoomLevel: 16,
  },
} as const;

export const RemoteMapZonesLayers = memo(
  ({ tilesetUrl }: RemoteMapZonesLayersProps): ReactElement => {
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

    return (
      <VectorSource id="remote-boundaries-source" url={tilesetUrl}>
        {/* Neighborhood Layers - zoom 10-16 (rendered first = lowest priority) */}
        <CircleLayer
          id="neighborhood-boundaries-circles"
          sourceLayerID="neighborhood-data-layer-v1"
          minZoomLevel={zoomLevels.NEIGHBORHOOD.minZoomLevel}
          maxZoomLevel={zoomLevels.NEIGHBORHOOD.maxZoomLevel}
          style={circleStyle}
        />
        <SymbolLayer
          id="neighborhood-boundaries-labels"
          sourceLayerID="neighborhood-data-layer-v1"
          minZoomLevel={zoomLevels.NEIGHBORHOOD.minZoomLevel}
          maxZoomLevel={zoomLevels.NEIGHBORHOOD.maxZoomLevel}
          style={largeBoxTextStyle}
        />

        {/* District Layers - zoom 9-12 */}
        <CircleLayer
          id="district-boundaries-circles"
          sourceLayerID="district-data-layer-v1"
          minZoomLevel={zoomLevels.DISTRICT.minZoomLevel}
          maxZoomLevel={zoomLevels.DISTRICT.maxZoomLevel}
          style={circleStyle}
        />
        <SymbolLayer
          id="district-boundaries-labels"
          sourceLayerID="district-data-layer-v1"
          minZoomLevel={zoomLevels.DISTRICT.minZoomLevel}
          maxZoomLevel={zoomLevels.DISTRICT.maxZoomLevel}
          style={largeBoxTextStyle}
        />

        {/* City Layers - zoom 8-11 */}
        <CircleLayer
          id="city-boundaries-circles"
          sourceLayerID="city-data-layer-v1"
          minZoomLevel={zoomLevels.CITY.minZoomLevel}
          maxZoomLevel={zoomLevels.CITY.maxZoomLevel}
          style={circleStyle}
        />
        <SymbolLayer
          id="city-boundaries-labels"
          sourceLayerID="city-data-layer-v1"
          minZoomLevel={zoomLevels.CITY.minZoomLevel}
          maxZoomLevel={zoomLevels.CITY.maxZoomLevel}
          style={largeBoxTextStyle}
        />

        {/* County Layers - zoom 7-10 */}
        <CircleLayer
          id="county-boundaries-circles"
          sourceLayerID="county-data-layer-v1"
          minZoomLevel={zoomLevels.COUNTY.minZoomLevel}
          maxZoomLevel={zoomLevels.COUNTY.maxZoomLevel}
          style={circleStyle}
        />
        <SymbolLayer
          id="county-boundaries-labels"
          sourceLayerID="county-data-layer-v1"
          minZoomLevel={zoomLevels.COUNTY.minZoomLevel}
          maxZoomLevel={zoomLevels.COUNTY.maxZoomLevel}
          style={largeBoxTextStyle}
        />

        {/* Region Layers - zoom 6-10 */}
        <CircleLayer
          id="region-boundaries-circles"
          sourceLayerID="region-data-layer-v1"
          minZoomLevel={zoomLevels.REGION.minZoomLevel}
          maxZoomLevel={zoomLevels.REGION.maxZoomLevel}
          style={circleStyle}
        />
        <SymbolLayer
          id="region-boundaries-labels"
          sourceLayerID="region-data-layer-v1"
          minZoomLevel={zoomLevels.REGION.minZoomLevel}
          maxZoomLevel={zoomLevels.REGION.maxZoomLevel}
          style={largeBoxTextStyle}
        />

        {/* Country Layers - zoom 0-5 (rendered last = highest priority) */}
        <CircleLayer
          id="country-boundaries-circles"
          sourceLayerID="country-data-layer-v1"
          minZoomLevel={zoomLevels.COUNTRY.minZoomLevel}
          maxZoomLevel={zoomLevels.COUNTRY.maxZoomLevel}
          style={circleStyle}
        />
        <SymbolLayer
          id="country-boundaries-labels"
          sourceLayerID="country-data-layer-v1"
          minZoomLevel={zoomLevels.COUNTRY.minZoomLevel}
          maxZoomLevel={zoomLevels.COUNTRY.maxZoomLevel}
          style={largeBoxTextStyle}
        />
      </VectorSource>
    );
  },
);

RemoteMapZonesLayers.displayName = "RemoteMapZonesLayers";
