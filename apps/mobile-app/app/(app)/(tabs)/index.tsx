import { router } from "expo-router";
import { type ReactElement, useCallback } from "react";

import { CustomMapView } from "@/components/custom-ui/CustomMapView";
import { CustomText } from "@/components/custom-ui/CustomText";
import { MapButtons } from "@/components/custom-ui/MapButtons";
import { MapDebugInfo } from "@/components/custom-ui/MapDebugInfo";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { PlaceDetailsSheet } from "@/components/place-details/PlaceDetailsSheet";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";
import { useMapLogic } from "@/hooks/maps/useMapLogic";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- page file
export default function MapsTab(): ReactElement {
  // Utilisation du hook personnalisé pour toute la logique de la carte
  const {
    placesData,
    customShape,
    selectedPlaceInfo,
    mapRef,
    cameraRef,
    isFetchingPlaces,
    isFetchingAllZones,
    onMapIdle,
    onCameraChanged,
    onPress,
    setSelectedPlaceInfo,
    moveToUserLocation,
    resetMapOrientation,
    headingRealtime,
    zoomRealtime,
    isCentered,
  } = useMapLogic();

  const onBottomSheetClose = useCallback(() => {
    setSelectedPlaceInfo(null);
  }, [setSelectedPlaceInfo]);

  const onPressLink = useCallback(() => {
    router.push({
      pathname: "/validate-place/take-photo",
    });
  }, []);

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor="transparent"
      withHeader={false}
      isTabScreen={false}
      withTopSafeArea={false}
    >
      <Box className="flex-1">
        {(isFetchingPlaces || isFetchingAllZones) && (
          <Box
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            }}
          >
            <Box className="flex items-center justify-center rounded-xl bg-white p-6">
              <Spinner size="large" color={themeColors.secondary[500].hex} />
              <CustomText>
                {isFetchingPlaces
                  ? "Chargement des points..."
                  : "Chargement des zones..."}
              </CustomText>
            </Box>
          </Box>
        )}

        <CustomMapView
          mapRef={mapRef}
          cameraRef={cameraRef}
          customShape={customShape}
          selectedPlace={selectedPlaceInfo}
          onMapIdle={onMapIdle}
          onCameraChanged={onCameraChanged}
          onPress={onPress}
        />

        <MapButtons
          onCompassPress={resetMapOrientation}
          onLocatePress={moveToUserLocation}
          isCentered={isCentered}
          heading={headingRealtime}
        />

        <MapDebugInfo
          zoom={zoomRealtime ?? 0}
          placesCount={placesData?.length ?? 0}
        />

        <PlaceDetailsSheet
          place={selectedPlaceInfo}
          onPressLink={onPressLink}
          onClose={onBottomSheetClose}
        />
      </Box>
    </CustomScreenContainer>
  );
}
