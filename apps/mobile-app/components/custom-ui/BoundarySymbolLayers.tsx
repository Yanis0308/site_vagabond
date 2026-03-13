import { SymbolLayer } from "@rnmapbox/maps";
import { type ReactElement } from "react";

import {
  CITIES_WITH_MANAGED_DISTRICTS,
  combineBoundaryFilter,
  getBoundaryFilter,
  shouldDisplayBoundaryLevel,
} from "@/components/custom-ui/BoundaryFilters";
import { layersInfos } from "@/constants/MapLayersConfig";
import { fogOfWar } from "@/constants/MapLayersStyles";
import { useZoneCompletionData } from "@/hooks/useZoneCompletionData";
import { getZoneState } from "@/utils/zoneState";

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

export const BoundarySymbolLayers = ({
  sourceId,
}: BoundarySymbolLayersProps): ReactElement => {
  const { completionData } = useZoneCompletionData();

  // Style pour les textes avec informations combinées
  const baseSymbolLayerStyle = {
    symbolPlacement: "point",
    textAllowOverlap: false,
    symbolSortKey: ["-", ["get", "pois_count"]],
    textFont: ["literal", ["Open Sans Semibold", "Arial Unicode MS Bold"]],
    textSize: 12,
    textColor: fogOfWar.text.color,
    textHaloColor: fogOfWar.text.haloColor.unvisited,
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
      // Pour les CITY, vérifier qu'elles ont leurs districts gérés
      [
        "any",
        ["!=", ["get", "boundary_level"], "CITY"],
        ["in", ["get", "id"], ["literal", CITIES_WITH_MANAGED_DISTRICTS]],
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
    // Si seulement subzones_count > 0 (et pour les CITY, uniquement si districts gérés)
    [
      "all",
      [">", ["get", "subzones_count"], 0],
      [
        "any",
        ["!=", ["get", "boundary_level"], "CITY"],
        ["in", ["get", "id"], ["literal", CITIES_WITH_MANAGED_DISTRICTS]],
      ],
    ],
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

  let textStyleWithCompletionData: Record<string, unknown>;

  if (
    completionData === undefined ||
    Object.keys(completionData).length === 0
  ) {
    textStyleWithCompletionData = {
      ...baseSymbolLayerStyle,
      textField: defaultTextExpression,
    };
  } else {
    const textExpression: unknown[] = ["case"];

    // Ajouter les conditions pour les zones avec des stats utilisateur (seulement si on a des données)
    Object.entries(completionData).forEach(([zoneId, zone]) => {
      // Construire le texte d'affichage : ligne 1 nom, ligne 2 zones, ligne 3 pois
      let displayText = zone.name;

      // Ligne 2 : zones x/y et % zones
      // Pour les CITY, ne montrer les subzones (districts) que si la ville est gérée
      const shouldShowSubzones =
        zone.total_subzones_count > 0 &&
        (zone.boundary_level !== "CITY" ||
          CITIES_WITH_MANAGED_DISTRICTS.includes(zoneId));

      if (shouldShowSubzones) {
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
      const shouldShowPoisStats = ["CITY", "DISTRICT", "NEIGHBORHOOD"].includes(
        zone.boundary_level,
      );
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

    // Build textHaloColor expression per zone state
    const haloColorExpression: unknown[] = ["case"];
    for (const [zoneId, zone] of Object.entries(completionData)) {
      const state = getZoneState(zone);
      const haloColor =
        state === "completed"
          ? fogOfWar.text.haloColor.completed
          : state === "inProgress"
            ? fogOfWar.text.haloColor.inProgress
            : fogOfWar.text.haloColor.unvisited;
      haloColorExpression.push(["==", ["get", "id"], zoneId], haloColor);
    }
    haloColorExpression.push(fogOfWar.text.haloColor.unvisited);

    textStyleWithCompletionData = {
      ...baseSymbolLayerStyle,
      textField: textExpression,
      textColor: fogOfWar.text.color,
      textHaloColor: haloColorExpression,
    };
  }

  const textLayers = Object.entries(layersInfos)
    .filter(([boundaryLevel]) => shouldDisplayBoundaryLevel(boundaryLevel))
    .flatMap(([boundaryLevel, layer]) => {
      const baseFilter = getBoundaryFilter(boundaryLevel);
      const allowOverlap =
        boundaryLevel === "REGION" || boundaryLevel === "COUNTY";

      const tapConfigs = [layer.textAndPoint].flat();

      return tapConfigs.map((tap) => {
        const layerId =
          tap.layerKey !== undefined
            ? `${tap.symbolLayerId}-${tap.layerKey}`
            : tap.symbolLayerId;
        const filter = combineBoundaryFilter(baseFilter, tap.filter);

        return (
          <SymbolLayer
            key={layerId}
            id={layerId}
            sourceID={sourceId}
            sourceLayerID={tap.sourceLayerId}
            minZoomLevel={tap.minZoomLevel}
            maxZoomLevel={tap.maxZoomLevel}
            filter={filter}
            style={{
              ...textStyleWithCompletionData,
              textAllowOverlap: allowOverlap,
              textIgnorePlacement: allowOverlap,
            }}
          />
        );
      });
    });

  return <>{textLayers}</>;
};
