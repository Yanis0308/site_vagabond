import { MapMarker, Marker } from "react-native-maps";
import React, { useCallback, useEffect, useRef } from "react";
import Supercluster, { ClusterProperties } from "supercluster";
import { View, Text } from "react-native";

type ClusterMakerProps = {
  onPress: (data: Supercluster.PointFeature<ClusterProperties>) => void;
  data: Supercluster.PointFeature<ClusterProperties>;
};

export const ClusterMaker = ({ onPress, data }: ClusterMakerProps) => {
  const { geometry, properties } = data;
  const [longitude, latitude] = geometry.coordinates;

  const markerRef = useRef<MapMarker>(null);

  const redrawOnMap = () => {
    if (markerRef.current?.redraw) markerRef.current?.redraw();
  };

  useEffect(() => {
    redrawOnMap();
  });

  // console.log("rendering cluster", properties.cluster_id);

  const onPressMemoized = useCallback(() => {
    onPress(data);
  }, []);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title={`Cluster with ${properties.point_count} points`}
      onPress={onPressMemoized}
      tracksViewChanges={false}
    >
      <View
        style={{
          width: 50,
          height: 50,
          backgroundColor: "pink",
          borderRadius: 50,
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>{properties.point_count}</Text>
      </View>
    </Marker>
  );
};
