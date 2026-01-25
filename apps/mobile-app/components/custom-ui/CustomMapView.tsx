import {
  Camera,
  Images,
  LocationPuck,
  type MapState,
  MapView,
  VectorSource,
} from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { type OnPressEvent } from "@rnmapbox/maps/lib/typescript/src/types/OnPressEvent";
import {
  memo,
  type ReactElement,
  type RefObject,
  useCallback,
  useMemo,
} from "react";
import { Platform } from "react-native";

import { BoundaryLineLayer } from "@/components/custom-ui/BoundaryLineLayer";
import { BoundarySymbolLayers } from "@/components/custom-ui/BoundarySymbolLayers";
import { MapPOILayers } from "@/components/custom-ui/MapPOILayers";
import { config } from "@/constants/Config";
import { useMapImages } from "@/hooks/maps/useMapImages";
import { type OnPressEventPoi } from "@/hooks/maps/useMapLogic";
import { useUserVisitedPois } from "@/hooks/queries/useUserVisitedPois";
import { type PoiType } from "@/utils/types";

// Types
interface CustomMapViewProps {
  mapRef: RefObject<MapView | null>;
  cameraRef: RefObject<CameraRef | null>;
  selectedPlace: PoiType | null;
  onMapIdle: (mapState: MapState) => void;
  onCameraChanged: (mapState: MapState) => void;
  onPress: (event: OnPressEventPoi) => void;
}

export const CustomMapView = memo(function CustomMapView({
  mapRef,
  cameraRef,
  selectedPlace,
  onMapIdle,
  onCameraChanged,
  onPress,
}: CustomMapViewProps): ReactElement {
  const images = useMapImages();
  const {
    data: { visitedPoiIds },
  } = useUserVisitedPois();

  const pulsing = useMemo(() => ({ isEnabled: false }), []);

  const maxBounds = useMemo(
    () => ({
      ne: [21.62109, 57.32652], // Northeast corner (near Germany/Belgium border)
      sw: [-13.88672, 35.46067], // Southwest corner (near Spain border)
    }),
    [],
  );

  const boundariesSourceId = "remote-boundaries-source";
  const poisSourceId = "remote-pois-source";

  // Wrapper to convert OnPressEvent to OnPressEventPoi
  const handleVectorSourcePress = useCallback(
    (event: OnPressEvent) => {
      onPress(event as OnPressEventPoi);
    },
    [onPress],
  );

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      styleURL={config.mapboxStyleUrl}
      onMapIdle={onMapIdle}
      onCameraChanged={onCameraChanged}
      projection={"globe"}
      compassEnabled={false}
      scaleBarEnabled={false}
    >
      <Camera pitch={0} heading={0} ref={cameraRef} maxBounds={maxBounds} />
      <LocationPuck
        puckBearingEnabled
        puckBearing="heading"
        bearingImage={Platform.OS === "ios" ? undefined : "bearingImage"}
        pulsing={pulsing}
      />
      <Images images={images} />

      {/* Vector source for boundaries */}
      <VectorSource
        id={boundariesSourceId}
        url={config.mapboxBoundariesTilesetUrl}
      >
        {/* Boundary layers using the vector source */}
        <BoundaryLineLayer sourceId={boundariesSourceId} />
        <BoundarySymbolLayers sourceId={boundariesSourceId} />
      </VectorSource>

      <VectorSource
        id={poisSourceId}
        url={config.mapboxPoisTilesetUrl}
        onPress={handleVectorSourcePress}
      >
        <MapPOILayers
          sourceId={poisSourceId}
          selectedPlace={selectedPlace}
          visitedPoiIds={visitedPoiIds}
        />
      </VectorSource>
    </MapView>
  );
});
