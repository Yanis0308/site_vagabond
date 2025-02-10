import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { firebase } from "@react-native-firebase/auth";
import { router } from "expo-router";
import { type BBox } from "geojson";
import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet } from "react-native";
import MapView, {
  type MapPressEvent,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import type Supercluster from "supercluster";
import { type ClusterProperties } from "supercluster";
import useSupercluster from "use-supercluster";

import { ClusterMarker } from "@/components/ClusterMarker";
import { PlaceDetailsSheet } from "@/components/PlaceDetailsSheet";
import { PlaceMarker } from "@/components/PlaceMarker";
import { Box } from "@/components/ui/box";
import { mapStyle } from "@/constants/MapStyle";
import { usePlaces } from "@/hooks/queries/usePlaces";
import { useValidatedPlaces } from "@/hooks/queries/useValidatedPlaces";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

const isClusterPoint = (
  pointProperties: Supercluster.PointFeature<PoiType | ClusterProperties>,
): pointProperties is Supercluster.PointFeature<ClusterProperties> => {
  return "cluster" in pointProperties.properties;
};

export default React.memo(function MapsTab(): ReactElement {
  useEffect(() => {
    void firebase
      .auth()
      .currentUser?.getIdToken()
      .then((token) => {
        // logger("idToken", token);
      });
  }, []);

  const mapRef = useRef<MapView>(null);

  const { data: validatedPlacesData } = useValidatedPlaces();

  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{
    place: PoiType;
    isValidated: boolean;
  } | null>(null);

  // Dimensions et région de la carte
  const [region, setRegion] = useState({
    latitude: 50.63045814,
    longitude: 3.06281109,
    latitudeDelta: 0.05, // 5km
    longitudeDelta: 0.05,
  });

  const bounds = useMemo<BBox>(
    () =>
      // Calculer les limites de la carte (bounding box) pour Supercluster
      // Divide by 2 for only displaying inside view clusters
      [
        region.longitude - region.longitudeDelta * 2, // west
        region.latitude - region.latitudeDelta * 2, // south
        region.longitude + region.longitudeDelta * 2, // east
        region.latitude + region.latitudeDelta * 2, // north
      ],
    [region],
  );

  // arrondir à x mètres
  const { data: placesData } = usePlaces(
    useMemo(() => {
      return {
        minLat: bounds[1],
        maxLat: bounds[3],
        minLng: bounds[0],
        maxLng: bounds[2],
      };
    }, [bounds]),
  );
  logger("placesData.length", placesData?.length);

  const points: Supercluster.PointFeature<PoiType>[] = useMemo(() => {
    if (placesData === undefined) {
      return [];
    }
    return placesData.map((place) => {
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            // Longitude is before Latitude in GeoJSON
            place.coords.longitude,
            place.coords.latitude,
          ],
        },
        properties: place,
      };
    });
  }, [placesData]);

  const { clusters, supercluster } = useSupercluster(
    useMemo(
      () => ({
        points,
        bounds,
        zoom: Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2), // Calcul du zoom à partir de la delta
        options: {
          minZoom: 0, // default
          maxZoom: 20, // default 20
          minPoints: 3, // default 2
          radius: 20, // default 40 in pixels
          // extent: 512
          // nodeSize: 64
          // log: true, // default false
          // generateId: false
        }, // Paramètres du clustering
      }),
      [bounds, points, region.longitudeDelta],
    ),
  );

  const onPressCluster = useCallback(
    ({ id, geometry }: Supercluster.PointFeature<ClusterProperties>) => {
      if (mapRef.current === null) {
        return;
      }

      const [longitude, latitude] = geometry.coordinates;
      if (longitude === undefined || latitude === undefined) {
        return;
      }

      const expansionZoom =
        supercluster !== undefined
          ? Math.min(supercluster.getClusterExpansionZoom(Number(id)), 20)
          : 0;
      mapRef.current.animateCamera({
        center: { latitude, longitude },
        zoom: expansionZoom,
      });
    },
    [supercluster],
  );

  // const insets = useSafeAreaInsets();
  // logger(insets);

  //TODO: effectuer le calcul des cluster avec onRegionChange au lieu de onRegionChangeComplete
  // mais avec un debounce ou throttle
  logger("maps rendering");

  const markers = useMemo(
    () =>
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- seems ok because already in useMemo
      clusters.map((cluster) => {
        if (isClusterPoint(cluster)) {
          return (
            <ClusterMarker
              key={`cluster-${cluster.id}`}
              onPress={onPressCluster}
              data={cluster}
            />
          );
        } else {
          return (
            <PlaceMarker
              key={`place-${cluster.properties.id}`}
              place={cluster.properties}
              onSelect={() => {
                setSelectedPlaceInfo({
                  place: cluster.properties,
                  isValidated: Boolean(
                    validatedPlacesData?.has(Number(cluster.properties.id)),
                  ),
                });
              }}
            />
          );
        }
      }),
    [clusters, onPressCluster, validatedPlacesData],
  );

  const onPress = useCallback((event: MapPressEvent) => {
    if (event.nativeEvent.action !== "marker-press") {
      setSelectedPlaceInfo(null);
    }
  }, []);
  return (
    <BottomSheetModalProvider>
      <Box style={styles.container}>
        <PlaceDetailsSheet
          place={selectedPlaceInfo?.place ?? null}
          validatedPlace={
            selectedPlaceInfo?.place.id !== undefined
              ? (validatedPlacesData?.get(Number(selectedPlaceInfo.place.id)) ??
                null)
              : null
          }
          // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPressLink={(): void => {
            router.push({
              pathname: "/place-details/[place]",
              params: { place: `${selectedPlaceInfo?.place.id}` },
            });
          }}
        />

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton
          showsPointsOfInterest={false}
          moveOnMarkerPress={false}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
          // // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPress={onPress}
        >
          {markers}
        </MapView>
      </Box>
    </BottomSheetModalProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    // width: "100%",
    // height: "100%",
    flex: 1,
  },
});
