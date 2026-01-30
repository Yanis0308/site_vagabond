import { LineLayer } from "@rnmapbox/maps";
import { memo, type ReactElement, useMemo } from "react";

import {
  getBoundaryFilter,
  shouldDisplayBoundaryLevel,
} from "@/components/custom-ui/BoundaryFilters";
import { layersInfos } from "@/constants/MapLayersConfig";

interface BoundaryLineLayerProps {
  sourceId: string;
}

export const BoundaryLineLayer = memo(
  ({ sourceId }: BoundaryLineLayerProps): ReactElement => {
    // Style pour les contours polygonaux (LineLayer)
    const boundaryLineStyle: Record<string, unknown> = useMemo(() => {
      return {
        lineColor: [
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
        lineWidth: 1,
        lineOpacity: 0.8,
      };
    }, []);

    const lineLayers = useMemo(() => {
      return Object.entries(layersInfos)
        .filter(([boundaryLevel]) => shouldDisplayBoundaryLevel(boundaryLevel))
        .map(([boundaryLevel, layer]) => {
          const filter = getBoundaryFilter(boundaryLevel);

          return (
            <LineLayer
              key={layer.polygon.polygonLayerId}
              id={layer.polygon.polygonLayerId}
              sourceID={sourceId}
              sourceLayerID={layer.polygon.sourceLayerId}
              minZoomLevel={layer.polygon.minZoomLevel}
              maxZoomLevel={layer.polygon.maxZoomLevel}
              filter={filter}
              style={boundaryLineStyle}
            />
          );
        });
    }, [boundaryLineStyle, sourceId]);

    return <>{lineLayers}</>;
  },
);

BoundaryLineLayer.displayName = "BoundaryLineLayer";
