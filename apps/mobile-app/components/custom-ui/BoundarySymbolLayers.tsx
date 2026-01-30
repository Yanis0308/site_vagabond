import { SymbolLayer } from "@rnmapbox/maps";
import { memo, type ReactElement, useMemo } from "react";

import {
  getBoundaryFilter,
  shouldDisplayBoundaryLevel,
} from "@/components/custom-ui/BoundaryFilters";
import { layersInfos } from "@/constants/MapLayersConfig";
import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import { type ZoneUserStatType } from "@/utils/types";

interface BoundarySymbolLayersProps {
  sourceId: string;
}

// Fonction utilitaire pour obtenir le nom des sous-zones selon le type de zone parente
const getSubZoneName = (boundaryLevel: string): string => {
  const subZoneNames: Record<string, string> = {
    COUNTRY: "régions",
    REGION: "départements",
    COUNTY: "villes",
    CITY: "arrondissements",
    DISTRICT: "quartiers",
    NEIGHBORHOOD: "quartiers",
  };
  return subZoneNames[boundaryLevel] ?? "zones";
};

export const BoundarySymbolLayers = memo(
  ({ sourceId }: BoundarySymbolLayersProps): ReactElement => {
    const { data: zonesData } = useUserZoneStats();
    const userZoneStats = zonesData?.zonesStats;

    const completionData = useMemo(() => {
      return userZoneStats?.reduce<Record<string, ZoneUserStatType>>(
        (acc, zone) => {
          // Transformer l'ID de OSM-R-3219086 vers R-3219086
          const formattedZoneId = zone.zone_id.replace("OSM-", "");
          acc[formattedZoneId] = zone;
          return acc;
        },
        {},
      );
    }, [userZoneStats]);

    // Style pour les textes avec informations combinées
    const textStyleWithCompletionData: Record<string, unknown> = useMemo(() => {
      const baseSymbolLayerStyle = {
        // textPadding: 12, // Plus de padding
        // textHaloBlur: 3, // Effet plus doux avec un halo plus large
        symbolPlacement: "point",
        textAllowOverlap: false,
        symbolSortKey: ["-", ["get", "pois_count"]],
        textFont: ["literal", ["Open Sans Semibold", "Arial Unicode MS Bold"]],
        textSize: 12,
        textColor: "#FFFFFF",
        textAnchor: "center",
        // Couleur du gros encart selon le boundary level
        textHaloColor: [
          "case",
          ["==", ["get", "boundary_level"], "COUNTRY"],
          layersInfos.COUNTRY.color,
          ["==", ["get", "boundary_level"], "REGION"],
          layersInfos.REGION.color,
          ["==", ["get", "boundary_level"], "COUNTY"],
          layersInfos.COUNTY.color,
          ["==", ["get", "boundary_level"], "CITY"],
          layersInfos.CITY.color,
          ["==", ["get", "boundary_level"], "DISTRICT"],
          layersInfos.DISTRICT.color,
          ["==", ["get", "boundary_level"], "NEIGHBORHOOD"],
          layersInfos.NEIGHBORHOOD.color,
          layersInfos.CITY.color, // fallback
        ],
        textHaloWidth: 2,
      };

      // Expression Mapbox pour choisir le nom des sous-zones selon le boundary_level
      const subZoneNameExpression: unknown[] = [
        "case",
        ["==", ["get", "boundary_level"], "COUNTRY"],
        "régions",
        ["==", ["get", "boundary_level"], "REGION"],
        "départements",
        ["==", ["get", "boundary_level"], "COUNTY"],
        "villes",
        ["==", ["get", "boundary_level"], "CITY"],
        "arrondissements",
        ["==", ["get", "boundary_level"], "DISTRICT"],
        "quartiers",
        "zones", // fallback
      ];

      const defaultTextExpression: unknown[] = [
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
          " ",
          subZoneNameExpression,
          "\n0/",
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
          " ",
          subZoneNameExpression,
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

      if (
        completionData === undefined ||
        Object.keys(completionData).length === 0
      ) {
        return {
          ...baseSymbolLayerStyle,
          textField: defaultTextExpression,
        };
      }

      const textExpression: unknown[] = ["case"];

      // Ajouter les conditions pour les zones avec des stats utilisateur (seulement si on a des données)
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

          const subZoneName = getSubZoneName(zone.boundary_level);
          if (zonesPercent > 0) {
            displayText += `\n${zone.completed_subzones_count}/${zone.total_subzones_count} ${subZoneName} ${zonesPercent}%`;
          } else {
            displayText += `\n${zone.completed_subzones_count}/${zone.total_subzones_count} ${subZoneName}`;
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
      textExpression.push(defaultTextExpression);

      return {
        ...baseSymbolLayerStyle,
        textField: textExpression,
      };
    }, [completionData]);

    const textLayers = useMemo(() => {
      return Object.entries(layersInfos)
        .filter(([boundaryLevel]) => shouldDisplayBoundaryLevel(boundaryLevel))
        .map(([boundaryLevel, layer]) => {
          const filter = getBoundaryFilter(boundaryLevel);

          return (
            <SymbolLayer
              key={layer.textAndPoint.symbolLayerId}
              id={layer.textAndPoint.symbolLayerId}
              sourceID={sourceId}
              sourceLayerID={layer.textAndPoint.sourceLayerId}
              minZoomLevel={layer.textAndPoint.minZoomLevel}
              maxZoomLevel={layer.textAndPoint.maxZoomLevel}
              filter={filter}
              style={textStyleWithCompletionData}
            />
          );
        });
    }, [textStyleWithCompletionData, sourceId]);

    return <>{textLayers}</>;
  },
);

BoundarySymbolLayers.displayName = "BoundarySymbolLayers";
