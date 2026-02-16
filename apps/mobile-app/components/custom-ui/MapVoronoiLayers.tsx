import { FillLayer, LineLayer } from "@rnmapbox/maps";
import { type ReactElement } from "react";

import { MAP_LAYER_IDS } from "@/constants/MapLayerIds";
import { voronoi } from "@/constants/MapLayersStyles";

interface MapVoronoiLayersProps {
  sourceId: string;
  visitedPoiIds: string[];
  selectedPlaceId?: string | null;
}

export const MapVoronoiLayers = ({
  sourceId,
  visitedPoiIds,
  selectedPlaceId,
}: MapVoronoiLayersProps): ReactElement => {
  const selectedId = selectedPlaceId ?? "";

  const voronoiFillColor = [
    "case",
    ["==", ["get", "poiId"], ["literal", selectedId]],
    voronoi.fill.childColor.selected,
    ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
    voronoi.fill.childColor.completed,
    voronoi.fill.childColor.unvisited,
  ];

  const voronoiLineColor = [
    "case",
    ["==", ["get", "poiId"], ["literal", selectedId]],
    voronoi.line.childColor.selected,
    ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
    voronoi.line.childColor.completed,
    voronoi.line.childColor.unvisited,
  ];

  const voronoiLineWidth = [
    "case",
    ["==", ["get", "poiId"], ["literal", selectedId]],
    3,
    1,
  ];

  const voronoiFillOpacity = [
    "case",
    ["==", ["get", "poiId"], ["literal", selectedId]],
    voronoi.fill.opacity.selected,
    ["in", ["get", "poiId"], ["literal", visitedPoiIds]],
    voronoi.fill.opacity.completed,
    voronoi.fill.opacity.unvisited,
  ];

  return (
    <>
      <FillLayer
        id={MAP_LAYER_IDS.VORONOI_FOG_FILL}
        sourceID={sourceId}
        sourceLayerID="voronoi-zones-layer-v1"
        style={{
          fillColor: voronoiFillColor,
          fillOpacity: voronoiFillOpacity,
          fillAntialias: true,
        }}
      />
      <LineLayer
        id={MAP_LAYER_IDS.VORONOI_ZONE_OUTLINES}
        sourceID={sourceId}
        sourceLayerID="voronoi-zones-layer-v1"
        style={{
          lineColor: voronoiLineColor,
          lineWidth: voronoiLineWidth,
          lineOpacity: voronoi.line.opacity,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </>
  );
};

MapVoronoiLayers.displayName = "MapVoronoiLayers";
