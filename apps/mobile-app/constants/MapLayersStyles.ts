import { themeColors } from "@/components/ui/gluestack-ui-provider/config";

import { layersInfos } from "./MapLayersConfig";

/**
 * ============================================================================
 * FOG OF WAR STYLES
 * ============================================================================
 */
export const fogOfWar = {
  // Fill configurations
  fill: {
    opacity: {
      unvisited: 0.6,
      inProgress: 0.25,
      completed: 0,
    },
    childColor: {
      unvisited: themeColors.typography["400"].hex,
      inProgress: themeColors.typography["400"].hex,
      completed: themeColors.primary["100"].hex,
    },
  },

  // Line configurations
  line: {
    opacity: {
      unvisited: 1,
      inProgress: 1,
      completed: 1,
    },
    childColor: {
      unvisited: themeColors.typography["500"].hex,
      inProgress: themeColors.typography["500"].hex,
      completed: themeColors.primary["300"].hex,
    },
    parentColor: {
      unvisited: themeColors.typography["700"].hex,
      inProgress: themeColors.typography["700"].hex,
      completed: themeColors.primary["500"].hex,
    },
    width: 1.5,
  },

  // Text configurations
  text: {
    color: themeColors.typography["0"].hex,
    haloColor: {
      unvisited: themeColors.typography["600"].hex,
      inProgress: themeColors.primary["500"].hex,
      completed: themeColors.primary["400"].hex,
    },
  },

  // Zoom thresholds for switching between child and parent layers
  // Zoom thresholds for switching between child and parent layers
  zoomThresholds: {
    COUNTRY: layersInfos.REGION.polygon.minZoomLevel,
    REGION: layersInfos.COUNTY.polygon.minZoomLevel,
    COUNTY: layersInfos.CITY.polygon.minZoomLevel,
    CITY: layersInfos.CITY.fillBackground.maxZoomLevel,
    DISTRICT: layersInfos.CITY.fillBackground.maxZoomLevel, // 10 POIs
  } as Record<string, number>,
};

/**
 * ============================================================================
 * VORONOI STYLES
 * ============================================================================
 */
export const voronoi = {
  fill: {
    childColor: {
      selected: themeColors.secondary["400"].hex,
      completed: "transparent",
      unvisited: themeColors.typography["400"].hex,
    },
    opacity: {
      selected: fogOfWar.fill.opacity.inProgress, // 0.25
      completed: fogOfWar.fill.opacity.completed, // 0
      unvisited: fogOfWar.fill.opacity.unvisited, // 0.6
    },
  },
  line: {
    childColor: {
      selected: themeColors.secondary["500"].hex,
      completed: "transparent",
      unvisited: themeColors.typography["500"].hex,
    },
    opacity: fogOfWar.line.opacity.unvisited, // 1
  },
};
