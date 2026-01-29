import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { type ReactElement, useEffect } from "react";
import { useSharedValue } from "react-native-reanimated";

import { CustomMapView } from "@/components/custom-ui/CustomMapView";
import { MapButtons } from "@/components/custom-ui/MapButtons";
import { MapDebugInfo } from "@/components/custom-ui/MapDebugInfo";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { PlaceDetailsSheet } from "@/components/place-details/PlaceDetailsSheet";
import { SearchHeaderButton } from "@/components/SearchHeaderButton";
import { Box } from "@/components/ui/box";
import { useMapLogic } from "@/hooks/maps/useMapLogic";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { mapService } from "@/services/MapService";

export default function MapsTab(): ReactElement {
  // Utilisation du hook personnalisé pour toute la logique de la carte
  const {
    mapRef,
    cameraRef,
    onCameraChanged,
    onPress,
    moveToUserLocation,
    resetMapOrientation,
    headingRealtime,
    zoomRealtime,
    isCentered,
    moveToPlace,
  } = useMapLogic();

  const { selectedPlace, setSelectedPlace } = usePlaceSelection();

  // Register moveToPlace function in MapService so it's available to the search screen
  useEffect(() => {
    mapService.registerMoveToPlace(moveToPlace);

    // Cleanup on unmount
    return (): void => {
      mapService.clearMoveToPlace();
    };
  }, [moveToPlace]);

  // Execute pending move when screen is focused
  useFocusEffect(() => {
    mapService.triggerMoveToPlace();
  });

  const bottomSheetAnimatedIndex = useSharedValue(-1);

  const onBottomSheetClose = (): void => {
    setSelectedPlace(null);
  };

  const onPressLink = (): void => {
    router.push({
      pathname: "/validate-place/take-photo",
    });
  };

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor="transparent"
      withHeader={false}
      isTabScreen={false}
      withTopSafeArea={false}
    >
      <Box className="flex-1">
        <SearchHeaderButton
          bottomSheetAnimatedIndex={bottomSheetAnimatedIndex}
        />

        <CustomMapView
          mapRef={mapRef}
          cameraRef={cameraRef}
          selectedPlace={selectedPlace}
          onCameraChanged={onCameraChanged}
          onPress={onPress}
        />

        <MapButtons
          onCompassPress={resetMapOrientation}
          onLocatePress={moveToUserLocation}
          isCentered={isCentered}
          heading={headingRealtime}
        />

        <MapDebugInfo zoom={zoomRealtime ?? 0} placesCount={0} />

        <PlaceDetailsSheet
          place={selectedPlace}
          onPressLink={onPressLink}
          onClose={onBottomSheetClose}
          animatedIndex={bottomSheetAnimatedIndex}
        />
      </Box>
    </CustomScreenContainer>
  );
}
