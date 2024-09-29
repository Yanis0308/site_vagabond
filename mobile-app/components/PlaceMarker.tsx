import { Text } from "@/components/ui/text";
import { placesData } from "@/constants/Places";
import { useEffect, useRef } from "react";
import { ImageBackground, View } from "react-native";
import { MapMarker, Marker } from "react-native-maps";
export type Place = (typeof placesData)["data"][number];

type PlaceMarkerProps = {
  place: Place;
  onSelect: () => void;
};

export const PlaceMarker = ({ place, onSelect }: PlaceMarkerProps) => {
  const markerSize = 50;
  const imgSize = markerSize * 0.9;
  // console.log("rendering place", place.id);

  const markerRef = useRef<MapMarker>(null);

  const redrawOnMap = () => {
    if (markerRef.current !== null && "redraw" in markerRef.current) {
      // markerRef.current.redraw();
    }
  };

  useEffect(() => {
    redrawOnMap();
  });

  return (
    <Marker
      ref={markerRef}
      coordinate={place.attributes.position}
      title={place.attributes.title}
      description={place.attributes.description}
      tracksViewChanges={false}
      onSelect={onSelect}
    >
      {/* This not works without reason and made entire app blank crash */}
      {/*<Callout>*/}
      {/*  <Text>Empty me</Text>*/}
      {/*</Callout>*/}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          width: markerSize,
          height: markerSize,
          backgroundColor: "brown",
          borderRadius: 50,
          overflow: "hidden",
        }}
      >
        <ImageBackground
          source={{
            uri: `https://picsum.photos/seed/${place.id}/200/200`,
          }}
          onLoad={redrawOnMap}
          fadeDuration={0} // disable fade on Android
          resizeMode="cover"
          style={{
            width: imgSize,
            height: imgSize,
            overflow: "hidden",
            borderRadius: 50,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white" }}>✅</Text>
        </ImageBackground>
      </View>
    </Marker>
  );
};
