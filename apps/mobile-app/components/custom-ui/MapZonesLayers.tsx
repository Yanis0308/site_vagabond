import { ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import { memo, type ReactElement, useMemo } from "react";

// Définition des couleurs pour les bulles par boundary level
const boundaryColors = {
  COUNTRY: "#8B5CF6", // Purple
  REGION: "#EF4444", // Red
  COUNTY: "#F59E0B", // Amber
  CITY: "#10B981", // Emerald
  DISTRICT: "#3B82F6", // Blue
  NEIGHBORHOOD: "#EC4899", // Pink
};

interface MapZonesLayersProps {
  zonesGeoJSON: GeoJSON.FeatureCollection | undefined;
}

export const MapZonesLayers = memo(
  ({ zonesGeoJSON }: MapZonesLayersProps): ReactElement => {
    // Filtres mémorisés basés sur boundary_level pour éviter les violations des règles des hooks
    const countryFilter = useMemo(
      () => ["==", ["get", "boundary_level"], "COUNTRY"],
      [],
    );
    const regionFilter = useMemo(
      () => ["==", ["get", "boundary_level"], "REGION"],
      [],
    );
    const countyFilter = useMemo(
      () => ["==", ["get", "boundary_level"], "COUNTY"],
      [],
    );
    const cityFilter = useMemo(
      () => ["==", ["get", "boundary_level"], "CITY"],
      [],
    );
    const districtFilter = useMemo(
      () => ["==", ["get", "boundary_level"], "DISTRICT"],
      [],
    );
    const neighborhoodFilter = useMemo(
      () => ["==", ["get", "boundary_level"], "NEIGHBORHOOD"],
      [],
    );

    // Calcul du pourcentage de completion des POIs
    const poisCompletionPercentage = [
      "case",
      [">", ["get", "total_pois"], 0],
      [
        "round",
        ["*", ["/", ["get", "nb_visited_pois"], ["get", "total_pois"]], 100],
      ],
      0,
    ];

    // Style avec gros encart rectangulaire (halo très large)
    const largeBoxTextStyle: Record<string, unknown> = {
      textField: [
        "format",
        // Ligne 1: Nom seulement
        ["get", "name"],
        { "font-scale": 1.0 },
        "\n",
        {},
        // Ligne 2: Pourcentage + zones ou POIs
        [
          "case",
          [">", ["get", "total_children"], 0],
          // Si des zones enfants existent, afficher pourcentage + zones
          [
            "concat",
            ["to-string", poisCompletionPercentage],
            "% ",
            ["to-string", ["get", "nb_visited_children"]],
            "/",
            ["to-string", ["get", "total_children"]],
            " zones",
          ],
          // Sinon afficher pourcentage + POIs
          [
            "concat",
            ["to-string", poisCompletionPercentage],
            "% ",
            ["to-string", ["get", "nb_visited_pois"]],
            "/",
            ["to-string", ["get", "total_pois"]],
            " pois",
          ],
        ],
        { "font-scale": 1.0 }, // Ligne 2 aussi en taille normale
      ],
      textPadding: 12, // Plus de padding
      textHaloBlur: 3, // Effet plus doux avec un halo plus large
      symbolPlacement: "point",
      textAllowOverlap: false,
      textIgnorePlacement: false,
      symbolSortKey: ["-", ["get", "importance_score"]],
      textFont: ["literal", ["Open Sans Semibold", "Arial Unicode MS Bold"]],
      textSize: [
        "case",
        [">=", ["get", "importance_score"], 900000], // Countries
        16, // 12 → 16
        [">=", ["get", "importance_score"], 100000], // States/regions
        15, // 11 → 15
        ["<", ["get", "importance_score"], 70000], // Small places
        12, // 9 → 12
        // Default for cities, towns
        14, // 10 → 14
      ],
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
      // TRÈS GROS encart : halo encore plus large pour plus de visibilité
      textHaloWidth: [
        "case",
        [">=", ["get", "importance_score"], 900000], // Countries
        35, // 25 → 35
        [">=", ["get", "importance_score"], 100000], // States/regions
        30, // 22 → 30
        ["<", ["get", "importance_score"], 70000], // Small places
        22, // 16 → 22
        // Default for cities, towns
        28, // 20 → 28
      ],
      textAnchor: "center",
      textOpacity: 1,
    };

    return (
      <ShapeSource id="zones-unified" shape={zonesGeoJSON ?? undefined}>
        {/* Country Labels - Gros Encarts */}
        <SymbolLayer
          id="zones-unified-country"
          sourceID="zones-unified"
          minZoomLevel={2}
          maxZoomLevel={20}
          filter={countryFilter}
          style={largeBoxTextStyle}
        />

        {/* Region Labels - Gros Encarts */}
        <SymbolLayer
          id="zones-unified-region"
          sourceID="zones-unified"
          minZoomLevel={4}
          maxZoomLevel={20}
          filter={regionFilter}
          style={largeBoxTextStyle}
        />

        {/* County / Department Labels - Gros Encarts */}
        <SymbolLayer
          id="zones-unified-county"
          sourceID="zones-unified"
          minZoomLevel={8}
          maxZoomLevel={20}
          filter={countyFilter}
          style={largeBoxTextStyle}
        />

        {/* City Labels - Gros Encarts */}
        <SymbolLayer
          id="zones-unified-city"
          sourceID="zones-unified"
          minZoomLevel={8}
          maxZoomLevel={20}
          filter={cityFilter}
          style={largeBoxTextStyle}
        />

        {/* District Labels - Gros Encarts */}
        <SymbolLayer
          id="zones-unified-district"
          sourceID="zones-unified"
          minZoomLevel={12}
          maxZoomLevel={20}
          filter={districtFilter}
          style={largeBoxTextStyle}
        />

        {/* Neighborhood Labels - Gros Encarts */}
        <SymbolLayer
          id="zones-unified-neighborhood"
          sourceID="zones-unified"
          minZoomLevel={14}
          maxZoomLevel={20}
          filter={neighborhoodFilter}
          style={largeBoxTextStyle}
        />
      </ShapeSource>
    );
  },
);

MapZonesLayers.displayName = "MapZonesLayers";
