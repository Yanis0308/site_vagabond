import { ClusterMaker } from "@/components/ClusterMaker";
import { PlaceDetailsSheet } from "@/components/PlaceDetailsSheet";
import { Place, PlaceMarker } from "@/components/PlaceMarker";
import { Box } from "@/components/ui/box";
import { placesData } from "@/constants/Places";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView from "react-native-maps";
import Supercluster, { ClusterProperties } from "supercluster";
import useSupercluster from "use-supercluster";

const isClusterPoint = (
  pointProperties: Supercluster.PointFeature<Place | ClusterProperties>,
): pointProperties is Supercluster.PointFeature<ClusterProperties> => {
  return "cluster" in pointProperties.properties;
};

export default function MapsTab() {
  const mapRef = useRef<MapView>(null);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // const [location, setLocation] = useState<LocationObject | null>(null);
  // const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const points: Supercluster.PointFeature<Place>[] = placesData.data.map(
    (place) => {
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            // Longitude is before Latitude in GeoJSON
            place.attributes.position.longitude,
            place.attributes.position.latitude,
          ],
        },
        properties: place,
      };
    },
  );

  // Dimensions et région de la carte
  const [region, setRegion] = useState({
    latitude: 50.63045814,
    longitude: 3.06281109,
    latitudeDelta: 0.05, // 5km
    longitudeDelta: 0.05,
  });

  const bounds = {
    // Calculer les limites de la carte (bounding box) pour Supercluster
    // Divide by 2 for only displaying inside view clusters
    north: region.latitude + region.latitudeDelta * 2,
    south: region.latitude - region.latitudeDelta * 2,
    east: region.longitude + region.longitudeDelta * 2,
    west: region.longitude - region.longitudeDelta * 2,
  };

  // Utilisation du hook useSupercluster
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: [bounds.west, bounds.south, bounds.east, bounds.north],
    zoom: Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2), // Calcul du zoom à partir de la delta
    options: {
      minZoom: 0, // default
      maxZoom: 20, // default 20
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
      const [longitude, latitude] = geometry.coordinates;

      const expansionZoom = supercluster
        ? Math.min(supercluster.getClusterExpansionZoom(Number(id)), 20)
        : 0;
      mapRef?.current?.animateCamera({
        center: { latitude, longitude },
        zoom: expansionZoom,
      });
    },
    [mapRef.current],
  );

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
