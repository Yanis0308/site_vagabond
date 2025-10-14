import { type MapState, type MapView } from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { getDistance } from "geolib";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePlaces } from "@/hooks/queries/usePlaces";
import { useUserLocation } from "@/hooks/queries/useUserLocation";
import { selectedPlaceAtom } from "@/stores/selectedPlaceAtom";
import { logger } from "@/utils/logger";
import {
  type PoiType,
  type VisitedPoiType,
  type ZoneStatType,
} from "@/utils/types";

import { useValidatedPlaces } from "../queries/useValidatedPlaces";

const getPoiIsVisited = (
  validatedPlaces: VisitedPoiType[] | undefined,
  poiId: string,
): boolean => {
  if (validatedPlaces === undefined) {
    return false;
  }

  return validatedPlaces.some((visitedPoi) => visitedPoi.poiId === poiId);
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
  selectedPlaceInfo: PoiType | null;
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
  isLoadingLocation: boolean;
  isFetchingPlaces: boolean;
  isFetchingAllZones: boolean;

  // Event handlers
  onMapIdle: (mapState: MapState) => void;
  onCameraChanged: (mapState: MapState) => void;
  onPress: (event: OnPressEvent) => void;

  // Actions
  setSelectedPlaceInfo: (place: PoiType | null) => void;
  moveToUserLocation: () => void;
  resetMapOrientation: () => void;
}

export const useMapLogic = (): UseMapLogicReturn => {
  const { data: validatedPlacesData } = useValidatedPlaces();
  const { data: userLocation, isLoading: isLoadingLocation } =
    useUserLocation();

  const [selectedPlaceInfo, setSelectedPlaceInfo] = useAtom(selectedPlaceAtom);
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

  const { data: placesData, isFetching: isFetchingPlaces } = usePlaces(
    bbox,
    zoom,
  );
  const isFetchingAllZones = false;
  const allZonesData = useMemo(() => [], []);

  // Mettre à jour le lieu sélectionné quand les données changent pour que le composant PlaceDetailsSheet se mette à jour avec les nouveaux avis etc
  useEffect(() => {
    if (selectedPlaceInfo !== null && placesData !== undefined) {
      const updatedPlace = placesData.find(
        (place) => place.id === selectedPlaceInfo.id,
      );
      if (updatedPlace !== undefined) {
        setSelectedPlaceInfo(updatedPlace);
      }
    }
  }, [placesData, selectedPlaceInfo, setSelectedPlaceInfo]);

  const moveToUserLocation = useCallback(() => {
    if (
      userLocation !== undefined &&
      userLocation !== null &&
      cameraRef.current !== null
    ) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 14,
        heading: 0, // reset orientation
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    }
  }, [userLocation]);

  const resetMapOrientation = useCallback(() => {
    if (cameraRef.current !== null) {
      cameraRef.current.setCamera({
        heading: 0,
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    }
  }, []);

  // Centrer la caméra sur la position de l'utilisateur
  useEffect(
    () => {
      if (!isLoadingLocation) {
        moveToUserLocation();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OK
    [isLoadingLocation],
  );

  // Données formatées pour la carte
  // TODO: déplacer ça ailleurs
  const customShape = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features:
        placesData?.map((place, index) => {
          const isVisited = getPoiIsVisited(validatedPlacesData, place.id);
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
  }, [placesData, validatedPlacesData]);

  // Gestion des événements de la carte
  const onMapIdle = useCallback((mapState: MapState) => {
    setZoom(mapState.properties.zoom);
    const { ne: northEast, sw: southWest } = mapState.properties.bounds;
    setBbox({
      minLat: southWest[1] ?? 0,
      maxLat: northEast[1] ?? 0,
      minLng: southWest[0] ?? 0,
      maxLng: northEast[0] ?? 0,
    });
  }, []);

  const onCameraChanged = useCallback(
    (mapState: MapState) => {
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
    },
    [userLocation],
  );

  const onPress = useCallback(
    (event: OnPressEvent) => {
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
          logger("Feature properties:", properties);

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
            logger("event properties", poiData);
            setSelectedPlaceInfo(poiData);
          }
        }
      } catch (error) {
        logger("Erreur lors du traitement de l'événement onPress:", error);
      }
    },
    [setSelectedPlaceInfo],
  );

  // URLs des images pour le chargement
  const imagesUrls = useMemo(() => {
    // CLUSTERING DÉSACTIVÉ - toujours charger les images
    // Avec clustering activé, utiliser cette logique :
    // if (zoom === null || zoom < CLUSTER_MAX_ZOOM) {
    //   return [];
    // }

    return (
      placesData?.map(
        (place) => `https://picsum.photos/seed/${place.id}/20/20`,
      ) ?? []
    );
  }, [placesData]); // Avec clustering: }, [placesData, zoom]);

  return useMemo(
    () => ({
      // Data
      placesData,
      allZonesData,
      customShape,
      selectedPlaceInfo,
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
      isLoadingLocation,
      isFetchingPlaces,
      isFetchingAllZones,

      // Event handlers
      onMapIdle,
      onCameraChanged,
      onPress,

      // Actions
      setSelectedPlaceInfo,
      moveToUserLocation,
      resetMapOrientation,
    }),
    [
      placesData,
      allZonesData,
      customShape,
      selectedPlaceInfo,
      userLocation,
      imagesUrls,
      bbox,
      headingRealtime,
      zoomRealtime,
      isCentered,
      mapRef,
      cameraRef,
      isLoadingLocation,
      isFetchingPlaces,
      isFetchingAllZones,
      onMapIdle,
      onCameraChanged,
      onPress,
      setSelectedPlaceInfo,
      moveToUserLocation,
      resetMapOrientation,
    ],
  );
};
