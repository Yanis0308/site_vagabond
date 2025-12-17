import { type MapState, type MapView } from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { getDistance } from "geolib";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { usePlaces } from "@/hooks/queries/usePlaces";
import { useUserLocation } from "@/hooks/queries/useUserLocation";
import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
import { logger } from "@/utils/logger";
import {
  type BriefVisitedPoiType,
  type PoiType,
  type ZoneStatType,
} from "@/utils/types";

const getPoiIsVisited = (
  visitedPoisByPoiIdMap: Map<string, BriefVisitedPoiType> | undefined,
  poiId: string,
): boolean => {
  return visitedPoisByPoiIdMap?.has(poiId) ?? false;
};

const getPoiIconName = (poi: PoiType, isVisited: boolean): string | null => {
  return isVisited ? "checkmark" : "questionMark";
};

export interface OnPressEvent {
  features: GeoJSON.Feature[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  point: {
    x: number;
    y: number;
  };
}

interface UseMapLogicReturn {
  // Data
  placesData: PoiType[] | undefined;
  allZonesData: ZoneStatType[] | undefined;
  customShape: GeoJSON.FeatureCollection;
  userLocation: { latitude: number; longitude: number } | undefined | null;
  imagesUrls: string[];
  bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;

  // Realtime states
  headingRealtime: number;
  zoomRealtime: number | null;
  isCentered: boolean;

  // Refs
  mapRef: React.RefObject<MapView | null>;
  cameraRef: React.RefObject<CameraRef | null>;

  // Loading states
  isFetchingPlaces: boolean;
  isFetchingAllZones: boolean;

  // Event handlers
  onMapIdle: (mapState: MapState) => void;
  onCameraChanged: (mapState: MapState) => void;
  onPress: (event: OnPressEvent) => void;

  // Actions
  moveToUserLocation: () => void;
  resetMapOrientation: () => void;
  moveToPlace: (
    coordinates: { latitude: number; longitude: number },
    isPoi?: boolean,
  ) => void;
}

export const useMapLogic = (): UseMapLogicReturn => {
  const { data: zonesData } = useUserZoneStats();
  const visitedPoisByPoiIdMap = zonesData?.visitedPoisByPoiIdMap;
  const userLocation = useUserLocation();
  const firstCenteringDone = useRef(false);

  const [bbox, setBbox] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);

  // États pour le zoom et heading (uniquement pour affichage en temps réel)
  const [headingRealtime, setHeadingRealtime] = useState(0);
  const [zoomRealtime, setZoomRealtime] = useState<number | null>(null);
  const [isCentered, setIsCentered] = useState(true);

  // État pour le zoom utilisé dans les requêtes
  const [zoom, setZoom] = useState<number | null>(null);

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<CameraRef>(null);

  // Refs pour stocker les valeurs précédentes et éviter les mises à jour inutiles
  const previousBboxRef = useRef<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const previousZoomRef = useRef<number | null>(null);

  // Tolérance pour les comparaisons de bbox (en degrés, ~100m)
  const BBOX_TOLERANCE = 0.0001;

  // Fonction helper pour comparer deux bbox avec tolérance
  const bboxHasChanged = (
    newBbox: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    },
    previousBbox: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    } | null,
  ): boolean => {
    if (previousBbox === null) {
      return true;
    }

    return (
      Math.abs(newBbox.minLat - previousBbox.minLat) > BBOX_TOLERANCE ||
      Math.abs(newBbox.maxLat - previousBbox.maxLat) > BBOX_TOLERANCE ||
      Math.abs(newBbox.minLng - previousBbox.minLng) > BBOX_TOLERANCE ||
      Math.abs(newBbox.maxLng - previousBbox.maxLng) > BBOX_TOLERANCE
    );
  };

  // Récupérer les données des places (l'atom est mis à jour automatiquement)
  const { data: placesData, isFetching: isFetchingPlaces } = usePlaces(
    bbox,
    zoom,
  );

  // Hook unifié pour gérer la sélection de lieu
  const { setSelectedPlace } = usePlaceSelection();

  const isFetchingAllZones = false;
  const allZonesData: ZoneStatType[] = [];

  const moveToUserLocation = useCallback(() => {
    if (userLocation !== null && cameraRef.current !== null) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 14,
        heading: 0, // reset orientation
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    }
  }, [userLocation]);

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

  // Centrer la caméra sur la position de l'utilisateur
  useEffect(() => {
    if (userLocation !== null && !firstCenteringDone.current) {
      moveToUserLocation();
      firstCenteringDone.current = true;
    }
  }, [userLocation, moveToUserLocation]);

  // Données formatées pour la carte
  // TODO: déplacer ça ailleurs
  const customShape = {
    type: "FeatureCollection" as const,
    features:
      placesData?.map((place, index) => {
        const isVisited = getPoiIsVisited(visitedPoisByPoiIdMap, place.id);
        const iconName = getPoiIconName(place, isVisited);

        return {
          type: "Feature" as const,
          properties: {
            id: place.id.toString(),
            baseId: index.toString(),
            name: place.data[0]?.name ?? "",
            data: place,
            imageUrl: `https://picsum.photos/seed/${place.id}/20/20`,
            isVisited: isVisited,
            iconName: iconName,
            // Filter level pour l'affichage différencié
            filterLevel: place.data[0]?.filterLevel ?? "UNKNOWN",
          },
          geometry: {
            type: "Point" as const,
            coordinates: [place.coords.longitude, place.coords.latitude],
          },
        };
      }) ?? [],
  };

  // Gestion des événements de la carte
  const onMapIdle = (mapState: MapState): void => {
    const newZoom = mapState.properties.zoom;
    const { ne: northEast, sw: southWest } = mapState.properties.bounds;
    const newBbox = {
      minLat: southWest[1] ?? 0,
      maxLat: northEast[1] ?? 0,
      minLng: southWest[0] ?? 0,
      maxLng: northEast[0] ?? 0,
    };

    // Vérifier si le zoom a changé (tolérance de 0.01 pour éviter les micro-changements)
    const zoomChanged =
      previousZoomRef.current === null ||
      Math.abs(newZoom - previousZoomRef.current) > 0.01;

    // Vérifier si le bbox a changé (avec tolérance)
    const bboxChanged = bboxHasChanged(newBbox, previousBboxRef.current);

    // Ne mettre à jour l'état que si les valeurs ont réellement changé
    if (zoomChanged) {
      previousZoomRef.current = newZoom;
      setZoom(newZoom);
    }

    if (bboxChanged) {
      previousBboxRef.current = newBbox;
      setBbox(newBbox);
    }
  };

  const onCameraChanged = (mapState: MapState): void => {
    const { center, heading } = mapState.properties;
    setHeadingRealtime(heading);
    setZoomRealtime(mapState.properties.zoom);
    if (userLocation !== null && userLocation !== undefined) {
      const distance = getDistance(
        { latitude: center[1] ?? 0, longitude: center[0] ?? 0 },
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
      );
      setIsCentered(distance < 20); // 20 meters of tolerance
    }
  };

  const onPress = (event: OnPressEvent): void => {
    logger("onPress");

    try {
      if (
        Array.isArray(event.features) &&
        event.features.length > 0 &&
        event.features[0]?.properties !== undefined &&
        typeof event.features[0].properties === "object" &&
        event.features[0].properties !== null
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

        const poiData = properties.data as PoiType | undefined;

        if (poiData !== undefined) {
          setSelectedPlace(poiData);
        }
      }
    } catch (error) {
      logger("Erreur lors du traitement de l'événement onPress:", error);
    }
  };

  // URLs des images pour le chargement
  // CLUSTERING DÉSACTIVÉ - toujours charger les images
  // Avec clustering activé, utiliser cette logique :
  // if (zoom === null || zoom < CLUSTER_MAX_ZOOM) {
  //   return [];
  // }
  const imagesUrls =
    placesData?.map(
      (place) => `https://picsum.photos/seed/${place.id}/20/20`,
    ) ?? [];

  return {
    // Data
    placesData,
    allZonesData,
    customShape,
    userLocation,
    imagesUrls,
    bbox,

    // Realtime states
    headingRealtime,
    zoomRealtime,
    isCentered,

    // Refs
    mapRef,
    cameraRef,

    // Loading states
    isFetchingPlaces,
    isFetchingAllZones,

    // Event handlers
    onMapIdle,
    onCameraChanged,
    onPress,

    // Actions
    moveToUserLocation,
    resetMapOrientation,
    moveToPlace,
  };
};
