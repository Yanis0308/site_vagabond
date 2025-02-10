import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import { type MapMarker, Marker } from "react-native-maps";
import type Supercluster from "supercluster";
import { type ClusterProperties } from "supercluster";

interface ClusterMarkerProps {
  onPress: (data: Supercluster.PointFeature<ClusterProperties>) => void;
  data: Supercluster.PointFeature<ClusterProperties>;
}

export const ClusterMarker = memo(({ onPress, data }: ClusterMarkerProps) => {
  const { geometry, properties } = data;
  const [longitudeOrUndefined, latitudeOrUndefined] = geometry.coordinates;
  const longitude = longitudeOrUndefined ?? 0;
  const latitude = latitudeOrUndefined ?? 0;

  const markerRef = useRef<MapMarker>(null);

  const redrawOnMap = (): void => {
    if (markerRef.current?.redraw !== undefined) markerRef.current.redraw();
  };

  useEffect(() => {
    redrawOnMap();
  });

  // logger("rendering cluster", properties.cluster_id);

  const onPressMemoized = useCallback(() => {
    onPress(data);
  }, [data, onPress]);

  const coordinate = useMemo(
    () => ({ latitude, longitude }),
    [latitude, longitude],
  );

  return (
    <Marker
      coordinate={coordinate}
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
});

ClusterMarker.displayName = "ClusterMarker";
