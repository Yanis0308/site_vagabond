import { FillLayer } from "@rnmapbox/maps";
import { type ReactElement } from "react";

import {
  combineBoundaryFilter,
  getBoundaryFilter,
  shouldDisplayBoundaryLevel,
} from "@/components/custom-ui/BoundaryFilters";
import { layersInfos } from "@/constants/MapLayersConfig";
import { fogOfWar } from "@/constants/MapLayersStyles";
import { useZoneCompletionData } from "@/hooks/useZoneCompletionData";

interface BoundaryFillLayerProps {
  sourceId: string;
}

const buildFillStyle = (
  state: "unvisited" | "inProgress" | "completed",
): Record<string, unknown> => {
  const color = fogOfWar.fill.childColor[state];
  const opacity = fogOfWar.fill.opacity[state];
  return { fillColor: color, fillOpacity: opacity };
};

export function BoundaryFillLayer({
  sourceId,
}: BoundaryFillLayerProps): ReactElement {
  const { zonesByLevelAndState, hasCompletionData } = useZoneCompletionData();

  const fogOfWarLevels = ["REGION", "COUNTY", "CITY", "DISTRICT"];

  const fillLayers = Object.entries(layersInfos)
    .filter(
      ([boundaryLevel]) =>
        shouldDisplayBoundaryLevel(boundaryLevel) &&
        fogOfWarLevels.includes(boundaryLevel),
    )
    .flatMap(([boundaryLevel, layer]) => {
      const baseFilter = getBoundaryFilter(boundaryLevel);
      const levelState = zonesByLevelAndState[boundaryLevel];

      if (!hasCompletionData || levelState === undefined) {
        return (
          <FillLayer
            key={layer.fillBackground.fillLayerId}
            id={layer.fillBackground.fillLayerId}
            sourceID={sourceId}
            sourceLayerID={layer.fillBackground.sourceLayerId}
            minZoomLevel={layer.fillBackground.minZoomLevel}
            maxZoomLevel={layer.fillBackground.maxZoomLevel}
            filter={baseFilter}
            style={buildFillStyle("unvisited")}
          />
        );
      }

      const { completed, inProgress } = levelState;
      const inProgressAndCompletedIds = [...inProgress, ...completed];

      const subLayers: ReactElement[] = [];

      if (inProgressAndCompletedIds.length === 0) {
        return (
          <FillLayer
            key={layer.fillBackground.fillLayerId}
            id={layer.fillBackground.fillLayerId}
            sourceID={sourceId}
            sourceLayerID={layer.fillBackground.sourceLayerId}
            minZoomLevel={layer.fillBackground.minZoomLevel}
            maxZoomLevel={layer.fillBackground.maxZoomLevel}
            filter={baseFilter}
            style={buildFillStyle("unvisited")}
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
        <FillLayer
          key={`${layer.fillBackground.fillLayerId}-unvisited`}
          id={`${layer.fillBackground.fillLayerId}-unvisited`}
          sourceID={sourceId}
          sourceLayerID={layer.fillBackground.sourceLayerId}
          minZoomLevel={layer.fillBackground.minZoomLevel}
          maxZoomLevel={layer.fillBackground.maxZoomLevel}
          filter={unvisitedLayerFilter}
          style={buildFillStyle("unvisited")}
        />,
      );

      if (inProgress.length > 0) {
        const inProgressLayerFilter = combineBoundaryFilter(baseFilter, [
          "in",
          ["get", "id"],
          ["literal", inProgress],
        ]);
        subLayers.push(
          <FillLayer
            key={`${layer.fillBackground.fillLayerId}-inProgress`}
            id={`${layer.fillBackground.fillLayerId}-inProgress`}
            sourceID={sourceId}
            sourceLayerID={layer.fillBackground.sourceLayerId}
            minZoomLevel={layer.fillBackground.minZoomLevel}
            maxZoomLevel={layer.fillBackground.maxZoomLevel}
            filter={inProgressLayerFilter}
            style={buildFillStyle("inProgress")}
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
          <FillLayer
            key={`${layer.fillBackground.fillLayerId}-completed`}
            id={`${layer.fillBackground.fillLayerId}-completed`}
            sourceID={sourceId}
            sourceLayerID={layer.fillBackground.sourceLayerId}
            minZoomLevel={layer.fillBackground.minZoomLevel}
            maxZoomLevel={layer.fillBackground.maxZoomLevel}
            filter={completedLayerFilter}
            style={buildFillStyle("completed")}
          />,
        );
      }

      return subLayers;
    });

  return <>{fillLayers}</>;
}
