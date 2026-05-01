import { type MapState, type MapView } from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { type OnPressEvent } from "@rnmapbox/maps/lib/typescript/src/types/OnPressEvent";
import { useThrottler } from "@tanstack/react-pacer";
import { type PoiFilterLevelEnum } from "@vagabond/shared-utils";
import { type Feature, type Geometry } from "geojson";
import { getDistance } from "geolib";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import {
  type UserLocationReturn,
  useUserLocation,
} from "@/hooks/queries/useUserLocation";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

// Module-level state survives component remounts
const persistentMapState = {
  firstCenteringDone: false,
  cameraCenter: null as [number, number] | null,
  cameraZoom: null as number | null,
};

interface SavedCameraState {
  center: [number, number] | null;
  zoom: number | null;
}

export const getSavedCameraState = (): SavedCameraState => ({
  center: persistentMapState.cameraCenter,
  zoom: persistentMapState.cameraZoom,
});

export const resetPersistentMapState = (): void => {
  persistentMapState.firstCenteringDone = false;
  persistentMapState.cameraCenter = null;
  persistentMapState.cameraZoom = null;
};

export interface OnPressEventPoi extends OnPressEvent {
  features: Array<
    Feature<
      Geometry,
      { poiId: string; name: string; filterLevel: PoiFilterLevelEnum }
    >
  >;
}

interface MapCenter {
  longitude: number;
  latitude: number;
}

interface UseMapLogicReturn {
  // Data
  simplifiedLocation: UserLocationReturn["simplifiedLocation"] | null;
  mapCenter: MapCenter | null;

  // Realtime states
  headingRealtime: number;
  zoomRealtime: number | null;
  isCentered: boolean;

  // Refs
  mapRef: RefObject<MapView | null>;
  cameraRef: RefObject<CameraRef | null>;

  // Event handlers
  onCameraChanged: (mapState: MapState) => void;
  onPress: (event: OnPressEventPoi) => void;

  // Actions
  moveToUserLocation: () => void;
  resetMapOrientation: () => void;
  moveToPlace: (
    coordinates: { latitude: number; longitude: number },
    isPoi?: boolean,
  ) => void;
}

export const useMapLogic = (): UseMapLogicReturn => {
  const { simplifiedLocation } = useUserLocation();

  // États pour le zoom et heading (uniquement pour affichage en temps réel)
  const [headingRealtime, setHeadingRealtime] = useState(0);
  const [zoomRealtime, setZoomRealtime] = useState<number | null>(null);
  const [isCentered, setIsCentered] = useState(true);
  const [mapCenter, setMapCenter] = useState<MapCenter | null>(null);

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<CameraRef>(null);

  // Hook unifié pour gérer la sélection de lieu
  const { setSelectedPlace } = usePlaceSelection();

  const moveToUserLocation = useCallback(() => {
    if (simplifiedLocation !== null && cameraRef.current !== null) {
      cameraRef.current.setCamera({
        centerCoordinate: [
          simplifiedLocation.longitude,
          simplifiedLocation.latitude,
        ],
        zoomLevel: 14,
        heading: 0, // reset orientation
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    }
  }, [simplifiedLocation]);

  const resetMapOrientation = (): void => {
    if (cameraRef.current !== null) {
      cameraRef.current.setCamera({
        heading: 0,
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    }
  };

  const moveToPlace = (
    coordinates: { latitude: number; longitude: number },
    isPoi = false,
  ): void => {
    if (cameraRef.current === null) {
      logger("cameraRef.current is null, cannot move to place");
      return;
    }

    // Apply north offset for POI to keep it visible above the bottom sheet
    // The bottom sheet occupies 60% of the screen height, so we shift the camera
    // latitude north by approximately to keep the POI visible
    const latitudeOffset = isPoi ? -0.005 : 0;
    const adjustedLatitude = coordinates.latitude + latitudeOffset;

    // For cities, zoom to the threshold where points appear (zoom >= 11)
    // For POIs, use a closer zoom level (14)
    const zoomLevel = isPoi ? 14 : 11.5;

    setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: [coordinates.longitude, adjustedLatitude],
        zoomLevel,
        heading: 0,
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    }, 100);
  };

  // Centrer la caméra sur la position de l'utilisateur (une seule fois au lancement)
  useEffect(() => {
    if (simplifiedLocation !== null && !persistentMapState.firstCenteringDone) {
      moveToUserLocation();
      persistentMapState.firstCenteringDone = true;
    }
  }, [simplifiedLocation, moveToUserLocation]);

  // Gestion des événements de la carte
  const cameraChangedDebouncer = useThrottler(
    (mapState: MapState): void => {
      const { center, heading, zoom } = mapState.properties;
      const lng = center[0];
      const lat = center[1];
      setHeadingRealtime(heading);
      setZoomRealtime(zoom);
      setMapCenter({ longitude: lng ?? 0, latitude: lat ?? 0 });

      // Persist camera state across component remounts (tab switches).
      // Skip writes when Mapbox emits a partially-undefined center to avoid
      // restoring the camera to [0, 0] on next mount.
      if (
        typeof lng === "number" &&
        typeof lat === "number" &&
        Number.isFinite(lng) &&
        Number.isFinite(lat) &&
        Number.isFinite(zoom)
      ) {
        persistentMapState.cameraCenter = [lng, lat];
        persistentMapState.cameraZoom = zoom;
      }

      if (simplifiedLocation !== null) {
        const distance = getDistance(
          { latitude: center[1] ?? 0, longitude: center[0] ?? 0 },
          {
            latitude: simplifiedLocation.latitude,
            longitude: simplifiedLocation.longitude,
          },
        );
        setIsCentered(distance < 20); // 20 meters of tolerance
      }
    },
    { wait: 50 },
  );

  // Annuler tout callback en attente au démontage pour éviter des setState
  // sur un composant démonté (memory leak / warnings React)
  useEffect((): (() => void) => {
    return () => {
      cameraChangedDebouncer.cancel();
    };
  }, [cameraChangedDebouncer]);

  const onCameraChanged = (mapState: MapState): void => {
    cameraChangedDebouncer.maybeExecute(mapState);
  };

  const onPress = (event: OnPressEventPoi): void => {
    try {
      if (
        Array.isArray(event.features) &&
        event.features.length > 0 &&
        event.features[0]?.properties !== undefined &&
        typeof event.features[0].properties === "object"
      ) {
        const properties = event.features[0].properties;

        // CLUSTERING DÉSACTIVÉ - pour réactiver, décommenter le code ci-dessous :
        // Vérifier si c'est un cluster
        // if (properties.cluster === true) {
        //   const clusterId = properties.cluster_id as number;
        //   logger("Cluster sélectionné", clusterId);
        //   logger("Point count:", properties.point_count);
        //
        //   // Zoom sur le cluster
        //   void mapRef.current?.getZoom().then((currentZoom) => {
        //     cameraRef.current?.moveTo(properties.coordinates as Position);
        //   });
        //   return;
        // }

        const poiData: PoiType | undefined = {
          id: properties.poiId,
          name: properties.name,
          filterLevel: properties.filterLevel,
          coords: {
            latitude: event.coordinates.latitude,
            longitude: event.coordinates.longitude,
          },
        };

        setSelectedPlace(poiData);
      }
    } catch (error) {
      logger("Erreur lors du traitement de l'événement onPress:", error);
    }
  };

  return {
    // Data
    simplifiedLocation,
    mapCenter,

    // Realtime states
    headingRealtime,
    zoomRealtime,
    isCentered,

    // Refs
    mapRef,
    cameraRef,

    // Event handlers
    onCameraChanged,
    onPress,

    // Actions
    moveToUserLocation,
    resetMapOrientation,
    moveToPlace,
  };
};
