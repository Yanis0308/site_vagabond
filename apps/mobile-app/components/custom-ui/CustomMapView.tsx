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
import { type ReactElement, type RefObject } from "react";
import { Platform } from "react-native";

import { BoundaryFillLayer } from "@/components/custom-ui/BoundaryFillLayer";
import { BoundaryLineLayer } from "@/components/custom-ui/BoundaryLineLayer";
import { BoundarySymbolLayers } from "@/components/custom-ui/BoundarySymbolLayers";
import { MapPOILayers } from "@/components/custom-ui/MapPOILayers";
import { MapVoronoiLayers } from "@/components/custom-ui/MapVoronoiLayers";
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
  onCameraChanged: (mapState: MapState) => void;
  onPress: (event: OnPressEventPoi) => void;
}

export const CustomMapView = function CustomMapView({
  mapRef,
  cameraRef,
  selectedPlace,
  onCameraChanged,
  onPress,
}: CustomMapViewProps): ReactElement {
  const images = useMapImages();
  const {
    data: { visitedPoiIds },
  } = useUserVisitedPois();

  const pulsing = { isEnabled: false };

  const maxBounds = {
    ne: [21.62109, 57.32652], // Northeast corner
    sw: [-13.88672, 35.46067], // Southwest corner
  };

  const boundariesSourceId = "remote-boundaries-source";
  const poisSourceId = "remote-pois-source";

  // Wrapper for vector source press events
  const handleVectorSourcePress = (event: OnPressEvent): void => {
    onPress(event as OnPressEventPoi);
  };

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      styleURL={config.mapboxStyleUrl}
      onCameraChanged={onCameraChanged}
      projection={"globe"}
      compassEnabled={false}
      scaleBarEnabled={false}
      pitchEnabled={false}
    >
      <Camera pitch={0} heading={0} ref={cameraRef} maxBounds={maxBounds} />
      <LocationPuck
        puckBearingEnabled
        puckBearing="heading"
        bearingImage={Platform.OS === "ios" ? undefined : "bearingImage"}
        pulsing={pulsing}
      />
      <Images images={images} />

      {/* 
          Z-INDEX STRATEGY:
          We use separate VectorSource blocks to control layer Z-index.
          The order below determines the visual layering (last source renders on top).
      */}

      {/* 1. Boundary Fills (Bottom) */}
      <VectorSource
        id={boundariesSourceId}
        url={config.mapboxBoundariesTilesetUrl}
      >
        <BoundaryFillLayer sourceId={boundariesSourceId} />
      </VectorSource>

      {/* 2. Voronoi Zones */}
      <VectorSource
        id={`${poisSourceId}-voronoi`}
        url={config.mapboxPoisTilesetUrl}
      >
        <MapVoronoiLayers
          sourceId={`${poisSourceId}-voronoi`}
          visitedPoiIds={visitedPoiIds}
          selectedPlaceId={selectedPlace?.id}
        />
      </VectorSource>

      {/* 3. Boundary Lines */}
      <VectorSource
        id={`${boundariesSourceId}-lines`}
        url={config.mapboxBoundariesTilesetUrl}
      >
        <BoundaryLineLayer sourceId={`${boundariesSourceId}-lines`} />
      </VectorSource>

      {/* 4. POIs */}
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

      {/* 5. Boundary Labels (Top) */}
      <VectorSource
        id={`${boundariesSourceId}-labels`}
        url={config.mapboxBoundariesTilesetUrl}
      >
        <BoundarySymbolLayers sourceId={`${boundariesSourceId}-labels`} />
      </VectorSource>
    </MapView>
  );
};

CustomMapView.displayName = "CustomMapView";
