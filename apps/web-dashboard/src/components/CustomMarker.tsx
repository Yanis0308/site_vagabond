import { Marker, type MarkerEvent } from "@vis.gl/react-maplibre";
import Image from "next/image";
import { type Dispatch, memo, type SetStateAction } from "react";

import { MARKER_SIZE } from "../app/pois/constants";
import { type RawPoi } from "../app/pois/types";

export const CustomMarker = memo(
  ({
    poi,
    setPopupInfo,
  }: {
    poi: RawPoi;
    setPopupInfo: Dispatch<
      SetStateAction<{
        poi: RawPoi;
        longitude: number;
        latitude: number;
      } | null>
    >;
  }) => {
    const wikiLink = poi.tags.wikidata ?? poi.tags.wikipedia;
    const hasName =
      poi.name !== undefined && poi.name !== null && poi.name !== "";

    return (
      <Marker
        key={poi.osm_id}
        longitude={poi.longitude}
        latitude={poi.latitude}
        anchor="bottom"
        onClick={(e: MarkerEvent<MouseEvent>) => {
          e.originalEvent.stopPropagation();
          setPopupInfo({
            poi,
            longitude: poi.longitude,
            latitude: poi.latitude,
          });
        }}
      >
        <Image
          src={hasName ? "/pink_marker.png" : "/cross_pink_marker.png"}
          alt="marker"
          width={MARKER_SIZE}
          height={MARKER_SIZE}
          className="cursor-pointer"
          style={{
            filter: wikiLink === undefined ? "grayscale(100%)" : undefined,
          }}
        />
      </Marker>
    );
  },
);
CustomMarker.displayName = "CustomMarker";
