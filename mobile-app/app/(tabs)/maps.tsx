import { ClusterMaker } from "@/components/ClusterMaker";
import { PlaceDetailsSheet } from "@/components/PlaceDetailsSheet";
import { PlaceMarker } from "@/components/PlaceMarker";
import { Box } from "@/components/ui/box";
import { usePlaces } from "@/hooks/queries/usePlaces";
import { PlaceType } from "@/http/places";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { BBox } from "geojson";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView from "react-native-maps";
import Supercluster, { ClusterProperties } from "supercluster";
import useSupercluster from "use-supercluster";

const isClusterPoint = (
  pointProperties: Supercluster.PointFeature<PlaceType | ClusterProperties>,
): pointProperties is Supercluster.PointFeature<ClusterProperties> => {
  return "cluster" in pointProperties.properties;
};

export default function MapsTab() {
  const mapRef = useRef<MapView>(null);
  const { data: placesData } = usePlaces();

  const [selectedPlace, setSelectedPlace] = useState<PlaceType | null>(null);

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

  const { clusters, supercluster } = useSupercluster({
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
  });

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
      mapRef?.current?.animateCamera({
        center: { latitude, longitude },
        zoom: expansionZoom,
      });
    },
    [supercluster],
  );

  //TODO: effectuer le calcul des cluster avec onRegionChange au lieu de onRegionChangeComplete
  // mais avec un debounce ou throttle
  console.log("maps rendering");

  return (
    <BottomSheetModalProvider>
      <Box style={styles.container}>
        <PlaceDetailsSheet
          place={selectedPlace}
          onPressLink={() => {
            router.push({
              pathname: "/place-details/[place]",
              params: { place: `${selectedPlace?.id ?? 33}` },
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
        >
          {clusters.map((cluster) => {
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
                  onSelect={() => setSelectedPlace(cluster.properties)}
                />
              );
            }
          })}
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
