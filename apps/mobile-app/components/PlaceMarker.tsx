import { memo, useCallback, useMemo, useRef } from "react";
import { ImageBackground, Platform, View } from "react-native";
import { type MapMarker, Marker } from "react-native-maps";

import { Text } from "@/components/ui/text";
import { useValidatedPlaces } from "@/hooks/queries/useValidatedPlaces";
import { type PoiType } from "@/utils/types";
interface PlaceMarkerProps {
  place: PoiType;
  onSelect: () => void;
}

export const PlaceMarker = memo(({ place, onSelect }: PlaceMarkerProps) => {
  const { data: validatePlacesData } = useValidatedPlaces();
  const markerSize = 40;
  const imgSize = markerSize * 0.9;
  // logger("rendering place", place.id);

  const markerRef = useRef<MapMarker>(null);

  const redrawOnMap = useCallback(() => {
    // There is a issue in iOS but the redraw is automatically made
    if (
      Platform.OS === "android" &&
      markerRef.current !== null &&
      "redraw" in markerRef.current
    ) {
      // logger("redraw", place.id);
      markerRef.current.redraw();
    }
  }, []);

  const placeIsValidated = useMemo<boolean>(() => {
    return Boolean(validatePlacesData?.has(Number(place.id)));
  }, [validatePlacesData, place.id]);

  // C'est trop fréquent pour peu de raison
  // useEffect(() => {
  //   logger("redraw", place.id);
  //   redrawOnMap();
  // });

  const source = useMemo(
    () => ({
      uri: `https://picsum.photos/seed/${place.id}/200/200`,
    }),
    [place.id],
  );
  return (
    <Marker
      ref={markerRef}
      coordinate={place.coords}
      title={place.data[0]?.name}
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
          source={source}
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
});

PlaceMarker.displayName = "PlaceMarker";
