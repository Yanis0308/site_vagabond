import { router } from "expo-router";
import { type ReactElement, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { CustomMapView } from "@/components/custom-ui/CustomMapView";
import { CustomText } from "@/components/custom-ui/CustomText";
import { MapButtons } from "@/components/custom-ui/MapButtons";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { PlaceDetailsSheet } from "@/components/place-details/PlaceDetailsSheet";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";
import { View } from "@/components/ui/view";
import { useMapLogic } from "@/hooks/maps/useMapLogic";
import { useUsersMe } from "@/hooks/queries/useUsersMe";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- page file
export default function MapsTab(): ReactElement {
  const { t } = useTranslation("common");

  const { data: userMe } = useUsersMe();

  // Utilisation du hook personnalisé pour toute la logique de la carte
  const {
    placesData,
    allZonesData,
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

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor="transparent"
      withHeader={false}
      isTabScreen={false}
    >
      <Box className="flex-1">
        <PlaceDetailsSheet
          place={selectedPlaceInfo}
          // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- will fix later
          onPressLink={(): void => {
            router.push({
              pathname: "/validate-place/take-photo",
            });
          }}
          onClose={onBottomSheetClose}
        />

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

        {userMe?.role === "ADMIN" && (
          <View
            style={{
              position: "absolute",
              top: 100,
              left: 10,
              padding: 5,
              borderRadius: 5,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            }}
          >
            <CustomText className="text-white">
              {t("zoom", { zoom: zoomRealtime })}
            </CustomText>
            <CustomText className="text-white">
              {t("pois", { pois: placesData?.length ?? 0 })}
            </CustomText>
            <CustomText className="text-white">
              {`Zones: ${allZonesData?.length ?? 0}`}
            </CustomText>
          </View>
        )}
      </Box>
    </CustomScreenContainer>
  );
}
