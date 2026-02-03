import { useFocusEffect } from "@react-navigation/native";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { type ReactElement, useEffect } from "react";
import { Alert, Platform } from "react-native";
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
import { currentPhotoAtom } from "@/stores/currentPhotoAtom";

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
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);

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

  const handlePhotoSelected = (imageUri: string): void => {
    setCurrentPhoto({ imageUri, fileId: null });
    router.push("/validate-place/review-form");
  };

  const openCamera = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin d'accéder à votre caméra",
      );
      return;
    }

    let result: ImagePicker.ImagePickerResult | null = null;

    if (Platform.OS === "ios" && !Device.isDevice) {
      Alert.alert(
        "Fonctionnalité non disponible",
        "Cette fonctionnalité n'est pas disponible sur le simulateur",
      );
    } else {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });
    }

    if (result !== null && !result.canceled && result.assets[0] !== undefined) {
      const asset = result.assets[0];
      handlePhotoSelected(asset.uri);
    }
  };

  const openGallery = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin d'accéder à votre galerie",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
    });

    if (!result.canceled && result.assets[0] !== undefined) {
      const asset = result.assets[0];
      handlePhotoSelected(asset.uri);
    }
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
          onPressCamera={openCamera}
          onPressGallery={openGallery}
          onClose={onBottomSheetClose}
          animatedIndex={bottomSheetAnimatedIndex}
        />
      </Box>
    </CustomScreenContainer>
  );
}
