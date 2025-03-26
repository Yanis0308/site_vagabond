import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  Camera,
  CircleLayer,
  Images,
  LocationPuck,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import { type CameraRef } from "@rnmapbox/maps/lib/typescript/src/components/Camera";
import { type Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { type FilterExpression } from "@rnmapbox/maps/src/utils/MapboxStyles";
import { router } from "expo-router";
import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import colors from "tailwindcss/colors";

import { useImageLoader } from "@/components/maps/imgLoader";
import { PlaceDetailsSheet } from "@/components/PlaceDetailsSheet";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { usePlaces } from "@/hooks/queries/usePlaces";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

// Constantes pour la gestion des images

// Constantes pour le clustering
const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 20;

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

export default React.memo(function MapsTab(): ReactElement {
  const [bounds, setBounds] = useState<
    [[number, number], [number, number]] | null
  >(null);

  const bbox = useMemo(() => {
    if (bounds === null) {
      return {
        minLat: 50.59363952684228,
        maxLat: 50.667247940449556,
        minLng: 3.029079629796854,
        maxLng: 3.096542550279054,
      };
    }

    return {
      minLat: bounds[0][1],
      maxLat: bounds[1][1],
      minLng: bounds[0][0],
      maxLng: bounds[1][0],
    };
  }, [bounds]);

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<CameraRef>(null);

  const { data: placesData, isFetching: isFetchingPlaces } = usePlaces(bbox);
  logger(placesData?.length, "places");

  const initialRegion = useMemo(() => {
    return [3.06281109, 50.63045814];
  }, []);

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
          },
          geometry: {
            type: "Point" as const,
            coordinates: [place.coords.longitude, place.coords.latitude],
          },
        })) ?? [],
    };
  }, [placesData]);

  const [zoom, setZoom] = useState<number | null>(null);

  const onRegionDidChange = useCallback(() => {
    void mapRef.current?.getZoom().then((currentZoom) => {
      setZoom(currentZoom);
    });

    void mapRef.current?.getVisibleBounds().then((visibleBounds) => {
      const northEast = visibleBounds[0];
      const southWest = visibleBounds[1];

      if (
        typeof northEast[0] === "number" &&
        typeof northEast[1] === "number" &&
        typeof southWest[0] === "number" &&
        typeof southWest[1] === "number"
      ) {
        setBounds([
          [northEast[0], northEast[1]],
          [southWest[0], southWest[1]],
        ]);
      }
    });
  }, []);

  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{
    place: PoiType;
    isValidated: boolean;
  } | null>(null);

  const onImageMissing = useCallback((imageKey: string) => {
    logger("🎞️🎞️🎞️ image missing", imageKey);
  }, []);

  const onPress = useCallback((event: OnPressEvent) => {
    logger("onPress");

    try {
      if (
        Array.isArray(event.features) &&
        event.features.length > 0 &&
        event.features[0]?.properties !== undefined &&
        typeof event.features[0].properties === "object" &&
        event.features[0].properties !== null
      ) {
        // Accès sécurisé aux propriétés
        const properties = event.features[0].properties;

        // Log toutes les propriétés pour déboguer
        logger("Feature properties:", properties);

        // Vérifier si c'est un cluster
        if (properties.cluster === true) {
          // Récupérer le cluster_id pour zoomer dessus
          const clusterId = properties.cluster_id as number;
          logger("Cluster sélectionné", clusterId);
          logger("Point count:", properties.point_count);

          // Zoom sur le cluster
          //TODO: getClusterExpansionZoom via ShapeSource ref
          void mapRef.current?.getZoom().then((currentZoom) => {
            cameraRef.current?.moveTo(
              // Math.min(currentZoom + 2, CLUSTER_MAX_ZOOM + 1),
              properties.coordinates as Position,
            );
            // cameraRef.current?.zoomTo(
            //   // Math.min(currentZoom + 2, CLUSTER_MAX_ZOOM + 1),
            //   CLUSTER_MAX_ZOOM + 1,
            // );
          });
          return;
        }

        const poiData = properties.data as PoiType | undefined;

        if (poiData !== undefined) {
          logger("event properties", poiData);
          setSelectedPlaceInfo({
            place: poiData,
            isValidated: false,
          });
        }
      }
    } catch (error) {
      logger("Erreur lors du traitement de l'événement onPress:", error);
    }
  }, []);

  // Filtres pour les couches
  const clusterFilter = useMemo<FilterExpression>(
    () => ["has", "point_count"] as const,
    [],
  );
  const unclusteredFilter = useMemo<FilterExpression>(
    () => ["!", ["has", "point_count"]] as const,
    [],
  );

  // Log pour déboguer les filtres
  useEffect(() => {
    logger("Cluster filter:", clusterFilter);
    logger("Unclustered filter:", unclusteredFilter);
  }, [clusterFilter, unclusteredFilter]);

  const imagesUrls = useMemo(() => {
    if (zoom === null || zoom < CLUSTER_MAX_ZOOM) {
      return [];
    }

    return (
      placesData?.map(
        (place) => `https://picsum.photos/seed/${place.id}/20/20`,
      ) ?? []
    );
  }, [placesData, zoom]);
  const { imagesLoaded, pendingRequests, queueLength } =
    useImageLoader(imagesUrls);

  return (
    <BottomSheetModalProvider>
      <Box className="flex-1">
        <PlaceDetailsSheet
          place={selectedPlaceInfo?.place ?? null}
          validatedPlace={null}
          // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPressLink={(): void => {
            if (selectedPlaceInfo?.place !== undefined) {
              router.push({
                pathname: "/place-details/[place]",
                params: { place: selectedPlaceInfo.place.id },
              });
            }
          }}
        />

        {isFetchingPlaces && (
          <Box className="absolute left-0 top-0 z-50 flex size-full items-center justify-center">
            <Spinner
              size="small"
              color={colors.gray[500]}
              className="bg-red-500"
            />
          </Box>
        )}

        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          styleURL="mapbox://styles/glutomax/cm8affmx4003a01qsd3aj52bi" // add "/draft" to use the draft style
          onRegionDidChange={onRegionDidChange}
          projection={"globe"}
          logoEnabled={false}
          compassEnabled={true}
          compassFadeWhenNorth={true}
          scaleBarEnabled={true}
        >
          <Camera
            centerCoordinate={initialRegion}
            zoomLevel={12}
            pitch={0}
            heading={0}
            ref={cameraRef}
          />
          <LocationPuck />
          {/* <Images images={imagesDefault} onImageMissing={onImageMissing} /> */}
          <Images images={imagesLoaded} onImageMissing={onImageMissing} />
          <ShapeSource
            id="earthquakes"
            shape={customShape}
            onPress={onPress}
            cluster
            clusterMaxZoomLevel={CLUSTER_MAX_ZOOM}
            clusterRadius={CLUSTER_RADIUS}
            // clusterProperties={clusterProperties}
          >
            <CircleLayer
              id="clusters"
              sourceID="earthquakes"
              filter={clusterFilter}
              style={{
                circleColor: [
                  "step",
                  ["get", "point_count"],
                  "#51bbd6", // couleur pour clusters de petite taille
                  20,
                  "#f1f075", // couleur pour clusters de taille moyenne (>= 20 points)
                  50,
                  "#f28cb1", // couleur pour grands clusters (>= 50 points)
                ],
                circleRadius: [
                  "step",
                  ["get", "point_count"],
                  15, // rayon pour clusters de petite taille
                  20,
                  20, // rayon pour clusters de taille moyenne
                  50,
                  25, // rayon pour grands clusters
                ],
                circleStrokeWidth: 2,
                circleStrokeColor: "#ffffff",
              }}
            />

            {/* Couche pour le compte de points dans les clusters */}
            <SymbolLayer
              id="cluster-count"
              sourceID="earthquakes"
              filter={clusterFilter}
              style={{
                textField: "{point_count_abbreviated}",
                textFont: ["Open Sans Bold"],
                textSize: 12,
                textColor: "#ffffff",
                // textAllowOverlap: true,
                // iconAllowOverlap: true,
              }}
            />

            {/* Couche pour les points non clusterisés */}
            <CircleLayer
              id="unclustered-point"
              sourceID="earthquakes"
              filter={unclusteredFilter}
              style={{
                circleColor: "#11b4da",
                circleRadius: 4,
                circleStrokeWidth: 1,
                circleStrokeColor: "#fff",
              }}
            />

            {/* Couche pour les icônes sur les points non clusterisés */}
            <SymbolLayer
              id="custom-marker-symbol"
              sourceID="earthquakes"
              filter={unclusteredFilter}
              style={{
                iconImage: [
                  "case",
                  ["has", ["get", "imageUrl"], ["literal", imagesLoaded]],
                  ["get", "imageUrl"],
                  "empty",
                ],
                iconAllowOverlap: true,
              }}
              minZoomLevel={CLUSTER_MAX_ZOOM}
            />
          </ShapeSource>
        </MapView>

        {/* Indicateurs de chargement */}
        <View
          style={{
            position: "absolute",
            top: 20,
            left: 10,
            padding: 5,
            borderRadius: 5,
          }}
        >
          <Text>Zoom: {zoom}</Text>
          <Text>POIs: {placesData?.length ?? 0}</Text>
          <Text>Img queue: {queueLength}</Text>
          <Text>Img loading: {pendingRequests}</Text>
          <Text>
            Clustering:{" "}
            {zoom !== null && zoom < CLUSTER_MAX_ZOOM + 1
              ? "Activé"
              : "Désactivé"}
          </Text>
        </View>
      </Box>
    </BottomSheetModalProvider>
  );
});
