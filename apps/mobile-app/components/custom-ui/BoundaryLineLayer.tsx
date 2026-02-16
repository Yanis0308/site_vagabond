import { LineLayer } from "@rnmapbox/maps";
import { type ReactElement } from "react";

import {
  combineBoundaryFilter,
  getBoundaryFilter,
  shouldDisplayBoundaryLevel,
} from "@/components/custom-ui/BoundaryFilters";
import { layersInfos } from "@/constants/MapLayersConfig";
import { fogOfWar } from "@/constants/MapLayersStyles";
import { useZoneCompletionData } from "@/hooks/useZoneCompletionData";

interface BoundaryLineLayerProps {
  sourceId: string;
}

const getLineColorForLevelAndState = (
  boundaryLevel: string,
  state: "unvisited" | "inProgress" | "completed",
): string | unknown[] => {
  const childColor = fogOfWar.line.childColor[state];
  const parentColor = fogOfWar.line.parentColor[state];

  const threshold = fogOfWar.zoomThresholds[boundaryLevel];
  if (threshold !== undefined) {
    return ["step", ["zoom"], childColor, threshold, parentColor];
  }
  return childColor;
};

const buildBoundaryLineStyle = (
  boundaryLevel: string,
  state: "unvisited" | "inProgress" | "completed",
): Record<string, unknown> => {
  const lineColor = getLineColorForLevelAndState(boundaryLevel, state);
  const lineOpacity = fogOfWar.line.opacity[state];
  return {
    lineColor,
    lineWidth: 1,
    lineOpacity,
  };
};

export const BoundaryLineLayer = ({
  sourceId,
}: BoundaryLineLayerProps): ReactElement => {
  const { zonesByLevelAndState, hasCompletionData } = useZoneCompletionData();

  // layersInfos order: NEIGHBORHOOD → ... → COUNTRY (parents already on top)
  // Within each level: unvisited (bottom), inProgress, completed (top)
  const lineLayers = Object.entries(layersInfos)
    .filter(([boundaryLevel]) => shouldDisplayBoundaryLevel(boundaryLevel))
    .flatMap(([boundaryLevel, layer]) => {
      const baseFilter = getBoundaryFilter(boundaryLevel);
      const lineWidth = fogOfWar.line.width;

      const levelState = zonesByLevelAndState[boundaryLevel];

      if (!hasCompletionData || levelState === undefined) {
        return (
          <LineLayer
            key={layer.polygon.polygonLayerId}
            id={layer.polygon.polygonLayerId}
            sourceID={sourceId}
            sourceLayerID={layer.polygon.sourceLayerId}
            minZoomLevel={layer.polygon.minZoomLevel}
            maxZoomLevel={layer.polygon.maxZoomLevel}
            filter={baseFilter}
            style={{
              ...buildBoundaryLineStyle(boundaryLevel, "unvisited"),
              lineWidth,
            }}
          />
        );
      }

      const { completed, inProgress } = levelState;
      const inProgressAndCompletedIds = [...inProgress, ...completed];

      const subLayers: ReactElement[] = [];

      if (inProgressAndCompletedIds.length === 0) {
        return (
          <LineLayer
            key={layer.polygon.polygonLayerId}
            id={layer.polygon.polygonLayerId}
            sourceID={sourceId}
            sourceLayerID={layer.polygon.sourceLayerId}
            minZoomLevel={layer.polygon.minZoomLevel}
            maxZoomLevel={layer.polygon.maxZoomLevel}
            filter={baseFilter}
            style={{
              ...buildBoundaryLineStyle(boundaryLevel, "unvisited"),
              lineWidth,
            }}
          />
        );
      }

      const unvisitedFilter: unknown[] = [
        "!",
        ["in", ["get", "id"], ["literal", inProgressAndCompletedIds]],
      ];
      const unvisitedLayerFilter = combineBoundaryFilter(
        baseFilter,
        unvisitedFilter,
      );
      subLayers.push(
        <LineLayer
          key={`${layer.polygon.polygonLayerId}-unvisited`}
          id={`${layer.polygon.polygonLayerId}-unvisited`}
          sourceID={sourceId}
          sourceLayerID={layer.polygon.sourceLayerId}
          minZoomLevel={layer.polygon.minZoomLevel}
          maxZoomLevel={layer.polygon.maxZoomLevel}
          filter={unvisitedLayerFilter}
          style={{
            ...buildBoundaryLineStyle(boundaryLevel, "unvisited"),
            lineWidth,
          }}
        />,
      );

      if (inProgress.length > 0) {
        const inProgressLayerFilter = combineBoundaryFilter(baseFilter, [
          "in",
          ["get", "id"],
          ["literal", inProgress],
        ]);
        subLayers.push(
          <LineLayer
            key={`${layer.polygon.polygonLayerId}-inProgress`}
            id={`${layer.polygon.polygonLayerId}-inProgress`}
            sourceID={sourceId}
            sourceLayerID={layer.polygon.sourceLayerId}
            minZoomLevel={layer.polygon.minZoomLevel}
            maxZoomLevel={layer.polygon.maxZoomLevel}
            filter={inProgressLayerFilter}
            style={{
              ...buildBoundaryLineStyle(boundaryLevel, "inProgress"),
              lineWidth,
            }}
          />,
        );
      }

      if (completed.length > 0) {
        const completedLayerFilter = combineBoundaryFilter(baseFilter, [
          "in",
          ["get", "id"],
          ["literal", completed],
        ]);
        subLayers.push(
          <LineLayer
            key={`${layer.polygon.polygonLayerId}-completed`}
            id={`${layer.polygon.polygonLayerId}-completed`}
            sourceID={sourceId}
            sourceLayerID={layer.polygon.sourceLayerId}
            minZoomLevel={layer.polygon.minZoomLevel}
            maxZoomLevel={layer.polygon.maxZoomLevel}
            filter={completedLayerFilter}
            style={{
              ...buildBoundaryLineStyle(boundaryLevel, "completed"),
              lineWidth,
            }}
          />,
        );
      }

      return subLayers;
    });

  return <>{lineLayers}</>;
};

BoundaryLineLayer.displayName = "BoundaryLineLayer";
