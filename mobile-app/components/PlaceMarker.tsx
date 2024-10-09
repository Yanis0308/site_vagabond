import { Text } from "@/components/ui/text";
import { useValidatedPlaces } from "@/hooks/queries/useValidatedPlaces";
import { PlaceType } from "@/http/places";
import { log } from "@/utils/logger";
import { useCallback, useMemo, useRef } from "react";
import { ImageBackground, Platform, View } from "react-native";
import { MapMarker, Marker } from "react-native-maps";

type PlaceMarkerProps = {
  place: PlaceType;
  onSelect: () => void;
};

export const PlaceMarker = ({ place, onSelect }: PlaceMarkerProps) => {
  const { data: validatePlacesData } = useValidatedPlaces();
  const markerSize = 40;
  const imgSize = markerSize * 0.9;
  // console.log("rendering place", place.id);

  const markerRef = useRef<MapMarker>(null);

  const redrawOnMap = useCallback(() => {
    // There is a issue in iOS but the redraw is automatically made
    if (
      Platform.OS === "android" &&
      markerRef.current !== null &&
      "redraw" in markerRef.current
    ) {
      log("redraw", place.id);
      markerRef.current.redraw();
    }
  }, [markerRef.current]);

  const placeIsValidated = useMemo<boolean>(() => {
    return !!validatePlacesData?.has(place.id);
  }, [validatePlacesData, place.id]);

  // C'est trop fréquent pour peu de raison
  // useEffect(() => {
  //   console.log("redraw", place.id);
  //   redrawOnMap();
  // });

  return (
    <Marker
      ref={markerRef}
      coordinate={place.position}
      title={place.title}
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
          <Text style={{ color: "white" }}>{placeIsValidated ? "✅" : ""}</Text>
        </ImageBackground>
      </View>
    </Marker>
  );
};
