import { FillLayer, LineLayer } from "@rnmapbox/maps";
import { type ReactElement } from "react";

import { MAP_LAYER_IDS } from "@/constants/MapLayerIds";
import { voronoi } from "@/constants/MapLayersStyles";
import { MAP_SOURCE_LAYER_IDS } from "@/constants/MapSources";

// Aligné sur MapPOILayers : voronoi/icônes apparaissent au même niveau de zoom.
const MIN_ZOOM_LEVEL = 10;

interface MapVoronoiLayersProps {
  sourceId: string;
  selectedPlaceId?: string | null;
}

// VG-471 — Le visited/unvisited est piloté via feature-state ["feature-state", "visited"],
// posé par useApplyVisitedFeatureStates. Plus aucune liste d'IDs n'est passée en prop ni
// inlinée dans les expressions de style : zéro scan O(K) par frame.
export const MapVoronoiLayers = ({
  sourceId,
  selectedPlaceId,
}: MapVoronoiLayersProps): ReactElement => {
  const selectedId = selectedPlaceId ?? "";

  const isVisitedExpr = ["boolean", ["feature-state", "visited"], false];

  const voronoiFillColor = [
    "case",
    ["==", ["get", "poiId"], ["literal", selectedId]],
    voronoi.fill.childColor.selected,
    isVisitedExpr,
    voronoi.fill.childColor.completed,
    voronoi.fill.childColor.unvisited,
  ];

  const voronoiLineColor = [
    "case",
    ["==", ["get", "poiId"], ["literal", selectedId]],
    voronoi.line.childColor.selected,
    isVisitedExpr,
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
    isVisitedExpr,
    voronoi.fill.opacity.completed,
    voronoi.fill.opacity.unvisited,
  ];

  return (
    <>
      <FillLayer
        id={MAP_LAYER_IDS.VORONOI_FOG_FILL}
        sourceID={sourceId}
        sourceLayerID={MAP_SOURCE_LAYER_IDS.VORONOI_ZONES}
        minZoomLevel={MIN_ZOOM_LEVEL}
        style={{
          fillColor: voronoiFillColor,
          fillOpacity: voronoiFillOpacity,
          fillAntialias: true,
        }}
      />
      <LineLayer
        id={MAP_LAYER_IDS.VORONOI_ZONE_OUTLINES}
        sourceID={sourceId}
        sourceLayerID={MAP_SOURCE_LAYER_IDS.VORONOI_ZONES}
        minZoomLevel={MIN_ZOOM_LEVEL}
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
