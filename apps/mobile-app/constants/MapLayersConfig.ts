import { type BoundaryLevelEnumType } from "@/utils/types";

// Définition des couleurs pour les bulles par boundary level
export const boundaryColors = {
  COUNTRY: "#8B5CF6", // Purple
  REGION: "#EF4444", // Red
  COUNTY: "#F59E0B", // Amber
  CITY: "#10B981", // Emerald
  DISTRICT: "#3B82F6", // Blue
  NEIGHBORHOOD: "#EC4899", // Pink
};

// IMPORTANT: L'ordre des propriétés dans cet objet détermine l'ordre de rendu des couches.
// Les premières propriétés sont rendues en arrière-plan, les dernières au premier plan.
// Ordre actuel : NEIGHBORHOOD (fond) → DISTRICT → CITY → COUNTY → REGION → COUNTRY (premier plan)
// Cela permet aux zones plus petites d'être visibles par-dessus les zones plus grandes.
export const layersInfos: Record<
  BoundaryLevelEnumType,
  {
    color: string;
    textAndPoint: {
      sourceLayerId: string;
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
    color: boundaryColors.NEIGHBORHOOD,
    textAndPoint: {
      sourceLayerId: "neighborhood-data-layer-v1",
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
    color: boundaryColors.DISTRICT,
    textAndPoint: {
      sourceLayerId: "district-data-layer-v1",
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
    color: boundaryColors.CITY,
    textAndPoint: {
      sourceLayerId: "city-data-layer-v1",
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
    color: boundaryColors.COUNTY,
    textAndPoint: {
      sourceLayerId: "county-data-layer-v1",
      symbolLayerId: "county-boundaries-labels",
      minZoomLevel: 6,
      maxZoomLevel: 10,
    },
    polygon: {
      sourceLayerId: "county-polygon-layer-v1",
      polygonLayerId: "county-boundaries-lines",
      minZoomLevel: 6,
      maxZoomLevel: 10,
    },
  },
  REGION: {
    color: boundaryColors.REGION,
    textAndPoint: {
      sourceLayerId: "region-data-layer-v1",
      symbolLayerId: "region-boundaries-labels",
      minZoomLevel: 3,
      maxZoomLevel: 10,
    },
    polygon: {
      sourceLayerId: "region-polygon-layer-v1",
      polygonLayerId: "region-boundaries-lines",
      minZoomLevel: 3,
      maxZoomLevel: 10,
    },
  },
  COUNTRY: {
    color: boundaryColors.COUNTRY,
    textAndPoint: {
      sourceLayerId: "country-data-layer-v1",
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
