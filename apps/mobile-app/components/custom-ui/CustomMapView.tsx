import {
  Camera,
  Images,
  LocationPuck,
  type MapState,
  MapView,
  VectorSource,
} from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { memo, type ReactElement, type RefObject, useMemo } from "react";
import { Platform } from "react-native";

import { BoundaryLineLayer } from "@/components/custom-ui/BoundaryLineLayer";
import { BoundarySymbolLayers } from "@/components/custom-ui/BoundarySymbolLayers";
import { MapPOILayers } from "@/components/custom-ui/MapPOILayers";
import { config } from "@/constants/Config";
import { useMapImages } from "@/hooks/maps/useMapImages";
import { type OnPressEvent } from "@/hooks/maps/useMapLogic";
import { type PoiType } from "@/utils/types";

// Types
interface CustomMapViewProps {
  mapRef: RefObject<MapView | null>;
  cameraRef: RefObject<CameraRef | null>;
  customShape: GeoJSON.FeatureCollection;
  selectedPlace: PoiType | null;
  onMapIdle: (mapState: MapState) => void;
  onCameraChanged: (mapState: MapState) => void;
  onPress: (event: OnPressEvent) => void;
}

export const CustomMapView = memo(function CustomMapView({
  mapRef,
  cameraRef,
  customShape,
  selectedPlace,
  onMapIdle,
  onCameraChanged,
  onPress,
}: CustomMapViewProps): ReactElement {
  const images = useMapImages();

  const pulsing = useMemo(() => ({ isEnabled: false }), []);

  const maxBounds = useMemo(
    () => ({
      ne: [12, 58], // Northeast corner (near Germany/Belgium border)
      sw: [-6, 36], // Southwest corner (near Spain border)
    }),
    [],
  );

  const boundariesSourceId = "remote-boundaries-source";

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      styleURL={config.mapboxStyleUrl}
      onMapIdle={onMapIdle}
      onCameraChanged={onCameraChanged}
      projection={"globe"}
      compassEnabled={false}
      compassFadeWhenNorth={true}
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
      <VectorSource id={boundariesSourceId} url={config.mapboxTilesetUrl}>
        {/* Boundary layers using the vector source */}
        <BoundaryLineLayer sourceId={boundariesSourceId} />
        <BoundarySymbolLayers sourceId={boundariesSourceId} />
      </VectorSource>

      <MapPOILayers
        customShape={customShape}
        onPress={onPress}
        selectedPlace={selectedPlace}
      />
    </MapView>
  );
});
