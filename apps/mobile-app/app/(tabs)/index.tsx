import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { BBox } from "geojson";
import React, {
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet } from "react-native";
import MapView from "react-native-maps";
import Supercluster, { ClusterProperties } from "supercluster";
import useSupercluster from "use-supercluster";

import { ClusterMaker } from "@/components/ClusterMaker";
import { PlaceDetailsSheet } from "@/components/PlaceDetailsSheet";
import { PlaceMarker } from "@/components/PlaceMarker";
import { Box } from "@/components/ui/box";
import { usePlaces } from "@/hooks/queries/usePlaces";
import { useValidatedPlaces } from "@/hooks/queries/useValidatedPlaces";
import { PlaceType } from "@/http/places";
import { logger } from "@/utils/logger";

const isClusterPoint = (
  pointProperties: Supercluster.PointFeature<PlaceType | ClusterProperties>,
): pointProperties is Supercluster.PointFeature<ClusterProperties> => {
  return "cluster" in pointProperties.properties;
};

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function MapsTab(): ReactElement {
  const mapRef = useRef<MapView>(null);
  const { data: placesData } = usePlaces();
  const { data: validatedPlacesData } = useValidatedPlaces();

  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{
    place: PlaceType;
    isValidated: boolean;
  } | null>(null);

  const points: Supercluster.PointFeature<PlaceType>[] = useMemo(() => {
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
            place.position.longitude,
            place.position.latitude,
          ],
        },
        properties: place,
      };
    });
  }, [placesData]);

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

  const { clusters, supercluster } = useSupercluster(
    useMemo(
      () => ({
        points,
        bounds,
        zoom: Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2), // Calcul du zoom à partir de la delta
        options: {
          minZoom: 0, // default
          maxZoom: 10, // default 20
          minPoints: 3, // default 2
          radius: 75, // default 40 in pixels
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

      const expansionZoom = supercluster
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
            <ClusterMaker
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
                  isValidated: !!validatedPlacesData?.has(
                    cluster.properties.id,
                  ),
                });
              }}
            />
          );
        }
      }),
    [clusters, onPressCluster, validatedPlacesData],
  );

  return (
    <BottomSheetModalProvider>
      <Box style={styles.container}>
        <PlaceDetailsSheet
          place={selectedPlaceInfo?.place ?? null}
          validatedPlace={
            selectedPlaceInfo?.place.id
              ? (validatedPlacesData?.get(selectedPlaceInfo.place.id) ?? null)
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
          mapType={"hybrid"}
          showsPointsOfInterest={false}
          moveOnMarkerPress={false}
          // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          customMapStyle={[
            {
              elementType: "labels",
              stylers: [
                {
                  visibility: "off",
                },
              ],
            },
          ]}
          // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPress={(event): void => {
            if (event.nativeEvent.action !== "marker-press") {
              setSelectedPlaceInfo(null);
            }
          }}
        >
          {markers}
        </MapView>
      </Box>
    </BottomSheetModalProvider>
  );
}

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
