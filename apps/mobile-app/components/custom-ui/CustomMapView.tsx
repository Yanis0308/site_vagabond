import {
  Camera,
  Images,
  LocationPuck,
  type MapState,
  MapView,
} from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import {
  memo,
  type ReactElement,
  type RefObject,
  useCallback,
  useMemo,
} from "react";
import { Platform } from "react-native";

import { MapPOILayers } from "@/components/custom-ui/MapPOILayers";
import { useMapImages } from "@/hooks/maps/useMapImages";
import { type OnPressEvent } from "@/hooks/maps/useMapLogic";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

import { RemoteMapZonesLayers } from "./RemoteMapZonesLayers";

// Types
interface CustomMapViewProps {
  mapRef: RefObject<MapView | null>;
  cameraRef: RefObject<CameraRef | null>;
  customShape: GeoJSON.FeatureCollection;
  selectedPlace: PoiType | null;
  onMapIdle: (mapState: MapState) => void;
  onCameraChanged: (mapState: MapState) => void;
  onPress: (event: OnPressEvent) => void;
  enableCountryFeatureLogging?: boolean;
}

export const CustomMapView = memo(function CustomMapView({
  mapRef,
  cameraRef,
  customShape,
  selectedPlace,
  onMapIdle,
  onCameraChanged,
  onPress,
  enableCountryFeatureLogging = false,
}: CustomMapViewProps): ReactElement {
  const images = useMapImages();
  // const { data: zonesGeoJSON } = useZonesGeoJSON();

  const pulsing = useMemo(() => ({ isEnabled: false }), []);
  const scaleBarPosition = useMemo(() => ({ bottom: 100, right: 200 }), []);

  const maxBounds = useMemo(
    () => ({
      ne: [12, 58], // Northeast corner (near Germany/Belgium border)
      sw: [-6, 36], // Southwest corner (near Spain border)
    }),
    [],
  );

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      //TODO: déplacer en .env
      styleURL="mapbox://styles/glutomax/cm8affmx4003a01qsd3aj52bi" // add "/draft" to use the draft style
      onMapIdle={onMapIdle}
      onCameraChanged={onCameraChanged}
      projection={"globe"}
      compassEnabled={false}
      compassFadeWhenNorth={true}
      scaleBarEnabled={true}
      scaleBarPosition={scaleBarPosition}
    >
      <Camera pitch={0} heading={0} ref={cameraRef} maxBounds={maxBounds} />
      <LocationPuck
        puckBearingEnabled
        puckBearing="heading"
        bearingImage={Platform.OS === "ios" ? undefined : "bearingImage"}
        pulsing={pulsing}
      />
      <Images images={images} />
      <MapPOILayers
        customShape={customShape}
        onPress={onPress}
        selectedPlace={selectedPlace}
      />

      {/* Zones administratives */}
      <RemoteMapZonesLayers tilesetUrl="mapbox://glutomax.boundaries-tileset-v1" />
    </MapView>
  );
});
