import { type MapState, type MapView } from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePlaces } from "@/hooks/queries/usePlaces";
import { useUserLocation } from "@/hooks/queries/useUserLocation";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { selectedPlaceAtom } from "@/stores/selectedPlaceAtom";
import { calculateBboxWithMinSize } from "@/utils/bbox";
// import { CLUSTER_MAX_ZOOM } from "@/utils/bbox"; // Pour le clustering
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

// Type pour les tags OSM
interface OsmTags {
  tourism?: string;
  historic?: string;
  amenity?: string;
  leisure?: string;
  building?: string;
  man_made?: string;
  bridge?: string;
  government?: string;
  landuse?: string;
  [key: string]: string | undefined;
}

// Fonction pour obtenir l'emoji selon le type de POI
function getPoiEmoji(rawInfo: unknown): string {
  if (
    rawInfo === null ||
    rawInfo === undefined ||
    typeof rawInfo !== "object"
  ) {
    return "📍"; // Emoji par défaut
  }

  // Les tags OSM sont dans rawInfo
  const tags = rawInfo as OsmTags;

  // Tourism
  if (tags.tourism !== undefined) {
    switch (tags.tourism) {
      case "museum":
        return "🏛️";
      case "zoo":
        return "🦁";
      case "monument":
        return "🗿";
      case "artwork":
        return "🎨";
      case "viewpoint":
        return "🔭";
      case "attraction":
        return "🎢";
      case "aquarium":
        return "🐠";
      case "tower":
        return "🗼";
      case "information":
        return "ℹ️";
      default:
        return "🧳";
    }
  }

  // Historic
  if (tags.historic !== undefined) {
    switch (tags.historic) {
      case "castle":
        return "🏰";
      case "monument":
      case "memorial":
        return "🗿";
      case "city_gate":
        return "🚪";
      case "fort":
        return "🏰";
      default:
        return "🏺";
    }
  }

  // Amenity
  if (tags.amenity !== undefined) {
    switch (tags.amenity) {
      case "place_of_worship":
        return "⛪";
      case "townhall":
        return "🏛️";
      case "theatre":
        return "🎭";
      default:
        return "🏢";
    }
  }

  // Leisure
  if (tags.leisure !== undefined) {
    switch (tags.leisure) {
      case "park":
        return "🌳";
      case "marina":
        return "⚓";
      default:
        return "🎯";
    }
  }

  // Building historique
  if (tags.building !== undefined) {
    return "🏛️";
  }

  // Bridge
  if (tags.man_made === "bridge" || Boolean(tags.bridge)) {
    return "🌉";
  }

  // Government
  if (tags.government !== undefined) {
    return "🏛️";
  }

  // Cemetery
  if (tags.landuse === "cemetery") {
    return "⚰️";
  }

  // Fallback par défaut
  return "📍";
}

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
  customShape: GeoJSON.FeatureCollection;
  selectedPlaceInfo: PoiType | null;
  userLocation: { latitude: number; longitude: number } | undefined | null;
  imagesUrls: string[];
  zoom: number | null;
  bbox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null;
  heading: number;

  // Refs
  mapRef: React.RefObject<MapView | null>;
  cameraRef: React.RefObject<CameraRef | null>;

  // Loading states
  isLoadingLocation: boolean;
  isFetchingPlaces: boolean;

  // Event handlers
  onMapIdle: (mapState: MapState) => void;
  onPress: (event: OnPressEvent) => void;

  // Actions
  setSelectedPlaceInfo: (place: PoiType | null) => void;
  moveToUserLocation: () => void;
  resetMapOrientation: () => void;
}

export const useMapLogic = (): UseMapLogicReturn => {
  const user = useUsersMe();
  const { data: userLocation, isLoading: isLoadingLocation } =
    useUserLocation();

  const [selectedPlaceInfo, setSelectedPlaceInfo] = useAtom(selectedPlaceAtom);
  const [bbox, setBbox] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<CameraRef>(null);

  const { data: placesData, isFetching: isFetchingPlaces } = usePlaces(bbox);

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
  const customShape = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features:
        placesData?.map((place, index) => ({
          type: "Feature" as const,
          properties: {
            id: place.id.toString(),
            baseId: index.toString(),
            name: place.data[0]?.name ?? "foo",
            data: place,
            imageUrl: `https://picsum.photos/seed/${place.id}/20/20`,
            isVisited:
              place.visitedPois.find(
                ({ userId }: { userId: string }) => userId === user.data?.id,
              ) !== undefined,
            // Ajout des propriétés de popularité pour différencier la taille des points
            isPopular: (place.popularity ?? 0) >= 0.5,
            popularity: place.popularity ?? 0,
            // Emoji selon le type de POI
            emoji: getPoiEmoji(place.data[0]?.rawInfo),
          },
          geometry: {
            type: "Point" as const,
            coordinates: [place.coords.longitude, place.coords.latitude],
          },
        })) ?? [],
    };
  }, [placesData, user.data?.id]);

  // Gestion des événements de la carte
  const onMapIdle = useCallback((mapState: MapState) => {
    setZoom(mapState.properties.zoom);
    if (typeof mapState.properties.heading === "number") {
      setHeading(mapState.properties.heading);
    }
    const { ne: northEast, sw: southWest } = mapState.properties.bounds;

    try {
      const newBbox = calculateBboxWithMinSize(northEast, southWest);
      setBbox(newBbox);
    } catch (error) {
      logger("Erreur lors du calcul de la bbox:", error);
    }
  }, []);

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
      customShape,
      selectedPlaceInfo,
      userLocation,
      imagesUrls,
      zoom,
      bbox,
      heading,

      // Refs
      mapRef,
      cameraRef,

      // Loading states
      isLoadingLocation,
      isFetchingPlaces,

      // Event handlers
      onMapIdle,
      onPress,

      // Actions
      setSelectedPlaceInfo,
      moveToUserLocation,
      resetMapOrientation,
    }),
    [
      placesData,
      customShape,
      selectedPlaceInfo,
      userLocation,
      imagesUrls,
      zoom,
      bbox,
      heading,
      mapRef,
      cameraRef,
      isLoadingLocation,
      isFetchingPlaces,
      onMapIdle,
      onPress,
      setSelectedPlaceInfo,
      moveToUserLocation,
      resetMapOrientation,
    ],
  );
};
