import { type MapState, type MapView } from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { type Viewport } from "@rnmapbox/maps/lib/typescript/src/components/Viewport";
import { type OnPressEvent } from "@rnmapbox/maps/lib/typescript/src/types/OnPressEvent";
import { useThrottler } from "@tanstack/react-pacer";
import { type PoiFilterLevelEnum } from "@vagabond/shared-utils";
import { type Feature, type Geometry } from "geojson";
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
  isFollowingUser: boolean;

  // Refs
  mapRef: RefObject<MapView | null>;
  cameraRef: RefObject<CameraRef | null>;
  viewportRef: RefObject<Viewport | null>;

  // Event handlers
  onCameraChanged: (mapState: MapState) => void;
  onViewportStatusChanged: (event: {
    from: { kind: string };
    to: { kind: string; state?: { kind: string } };
    reason: string;
  }) => void;
  onMapReady: () => void;
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
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [mapCenter, setMapCenter] = useState<MapCenter | null>(null);

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<CameraRef>(null);
  const viewportRef = useRef<Viewport>(null);

  // Hook unifié pour gérer la sélection de lieu
  const { setSelectedPlace } = usePlaceSelection();

  const followPuck = useCallback(async (immediate: boolean): Promise<void> => {
    if (viewportRef.current === null) return;
    const succeeded = await viewportRef.current.transitionTo(
      {
        kind: "followPuck",
        options: { zoom: 14, bearing: "keep", pitch: "keep" },
      },
      immediate
        ? { kind: "immediate" }
        : { kind: "default", maxDurationMs: 1500 },
    );
    if (succeeded) {
      setIsFollowingUser(true);
    }
  }, []);

  const onMapReady = useCallback((): void => {
    void followPuck(true);
  }, [followPuck]);

  const moveToUserLocation = (): void => {
    void followPuck(false);
  };

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

    if (viewportRef.current !== null) {
      void viewportRef.current.idle();
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

  // Gestion des événements de la carte
  const cameraChangedDebouncer = useThrottler(
    (mapState: MapState): void => {
      const { center, heading } = mapState.properties;
      setHeadingRealtime(heading);
      setZoomRealtime(mapState.properties.zoom);
      setMapCenter({ longitude: center[0] ?? 0, latitude: center[1] ?? 0 });
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

  const onViewportStatusChanged = (event: {
    from: { kind: string };
    to: { kind: string; state?: { kind: string } };
    reason: string;
  }): void => {
    const { to, reason } = event;

    if (reason === "TransitionStarted") return;

    if (to.kind === "idle") {
      setIsFollowingUser(false);
      return;
    }

    if (to.kind === "state" && to.state?.kind === "followPuck") {
      setIsFollowingUser(true);
      return;
    }

    if (reason === "UserInteraction") {
      setIsFollowingUser(false);
    }
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
    isFollowingUser,

    // Refs
    mapRef,
    cameraRef,
    viewportRef,

    // Event handlers
    onCameraChanged,
    onViewportStatusChanged,
    onMapReady,
    onPress,

    // Actions
    moveToUserLocation,
    resetMapOrientation,
    moveToPlace,
  };
};
