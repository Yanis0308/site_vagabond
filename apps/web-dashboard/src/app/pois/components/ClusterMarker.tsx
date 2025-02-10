import {
  type MapInstance,
  Marker,
  type MarkerEvent,
} from "@vis.gl/react-maplibre";
import {
  type Dispatch,
  memo,
  type RefObject,
  type SetStateAction,
} from "react";
import type Supercluster from "supercluster";

import { type RawPoi } from "../types";
import { CustomMarker } from "./CustomMarker";

export interface PoiCluster {
  type: "Feature";
  id?: string | number; // Rendre id optionnel
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count: number;
    point_count_abbreviated: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export const ClusterMarker = memo(
  ({
    cluster,
    supercluster,
    mapRef,
    setPopupInfo,
  }: {
    cluster: PoiCluster;
    supercluster: Supercluster | null;
    mapRef: RefObject<MapInstance | null>;
    setPopupInfo: Dispatch<
      SetStateAction<{
        poi: RawPoi;
        longitude: number;
        latitude: number;
      } | null>
    >;
  }) => {
    const [longitude, latitude] = cluster.geometry.coordinates;

    if (cluster.properties.cluster) {
      return (
        <Marker
          key={cluster.id}
          longitude={longitude}
          latitude={latitude}
          anchor="center"
          onClick={(e: MarkerEvent<MouseEvent>) => {
            e.originalEvent.stopPropagation();
            const clusterId = cluster.properties.cluster_id;
            const expansionZoom = supercluster?.getClusterExpansionZoom(
              clusterId ?? 0,
            );

            if (mapRef.current !== null) {
              mapRef.current.flyTo({
                center: [longitude, latitude],
                zoom: expansionZoom,
              });
            }
          }}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-pink-500 font-bold text-white">
            {cluster.properties.point_count}
          </div>
        </Marker>
      );
    }

    // Si ce n'est pas un cluster, c'est un point individuel
    const poi = (cluster as unknown as { properties: RawPoi }).properties;
    return (
      <CustomMarker key={poi.osm_id} poi={poi} setPopupInfo={setPopupInfo} />
    );
  },
);
ClusterMarker.displayName = "ClusterMarker";
