import { type ImageSource } from "@vagabond/shared-utils";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactElement, useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { AppReviewModal } from "@/components/app-review/AppReviewModal";
import { CustomMapView } from "@/components/custom-ui/CustomMapView";
import { MapButtons } from "@/components/custom-ui/MapButtons";
import { MapDebugInfo } from "@/components/custom-ui/MapDebugInfo";
import { MapLocationInfo } from "@/components/custom-ui/MapLocationInfo";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { PlaceDetailsSheet } from "@/components/place-details/PlaceDetailsSheet";
import { SearchHeaderButton } from "@/components/SearchHeaderButton";
import { Box } from "@/components/ui/box";
import { useMapLogic } from "@/hooks/maps/useMapLogic";
import { useMapZoneInfo } from "@/hooks/maps/useMapZoneInfo";
import { useAppReviewModal } from "@/hooks/other/useAppReviewModal";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { mapService } from "@/services/MapService";
import { currentPhotoAtom } from "@/stores/currentPhotoAtom";
import { displayingLoaderAtom } from "@/stores/displayingLoaderAtom";
import { compressImage } from "@/utils/imageCompressor";
import { logger } from "@/utils/logger";
import { waitForFile } from "@/utils/waitForFile";

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
    mapCenter,
  } = useMapLogic();

  const zoneName = useMapZoneInfo({
    mapView: mapRef.current,
    mapCenter,
    zoom: zoomRealtime,
  });

  const { selectedPlace, setSelectedPlace } = usePlaceSelection();
  const currentPhoto = useAtomValue(currentPhotoAtom);
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const setDisplayingLoader = useSetAtom(displayingLoaderAtom);

  // App review modal
  const { isVisible: isAppReviewModalVisible, onClose: onAppReviewClose } =
    useAppReviewModal();

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
  const scrollRepairNeededRef = useRef(false);

  const onBottomSheetClose = (): void => {
    setSelectedPlace(null);
  };

  const handlePhotoSelected = async (
    imageUri: string,
    imageSource: ImageSource,
  ): Promise<void> => {
    const compressedUri = await compressImage(imageUri);
    setCurrentPhoto({ imageUri: compressedUri, imageSource });
  };

  // Navigate to review form when a photo is selected (decoupled from picker flow)
  useEffect(() => {
    if (currentPhoto !== null && currentPhoto.imageUri !== "") {
      scrollRepairNeededRef.current = true;
      router.push("/validate-place/review-form");
    }
  }, [currentPhoto]);

  // Recover pending ImagePicker result on Android when MainActivity was killed
  useEffect(() => {
    const recoverPendingResult = async (): Promise<void> => {
      logger("[recoverPendingResult] start");
      const pending = await ImagePicker.getPendingResultAsync();
      if (pending === null) {
        logger("[recoverPendingResult] pending is null");
        return;
      }
      const result = pending;
      if ("code" in result) {
        logger("[recoverPendingResult] error result:", result);
        return;
      }
      if (result.canceled) {
        logger("[recoverPendingResult] user canceled");
      }
      const asset = result.assets?.[0];
      if (asset === undefined) {
        logger("[recoverPendingResult] no asset in result");
        return;
      }
      try {
        logger("[recoverPendingResult] recovering photo:", asset.uri);
        await waitForFile(asset.uri);
        setCurrentPhoto({ imageUri: asset.uri, imageSource: "CAMERA" });
        logger("[recoverPendingResult] success");
      } catch (error) {
        logger("[recoverPendingResult] waitForFile error:", error);
        Alert.alert(
          "Erreur",
          "La photo n'a pas pu être chargée. Veuillez réessayer.",
        );
      }
    };
    void recoverPendingResult();
  }, [setCurrentPhoto]);

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
        quality: 0.7, // recommended quality
      });
    }

    if (result !== null && !result.canceled && result.assets[0] !== undefined) {
      const asset = result.assets[0];
      try {
        setDisplayingLoader(true);
        await waitForFile(asset.uri);
        await handlePhotoSelected(asset.uri, "CAMERA");
      } catch {
        setDisplayingLoader(false);
        Alert.alert(
          "Erreur",
          "La photo n'a pas pu être chargée. Veuillez réessayer.",
        );
      }
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
      allowsEditing: false,
      quality: 0.7, // recommended quality
    });

    if (!result.canceled && result.assets[0] !== undefined) {
      const asset = result.assets[0];
      try {
        setDisplayingLoader(true);
        await waitForFile(asset.uri);
        await handlePhotoSelected(asset.uri, "GALLERY");
      } catch {
        setDisplayingLoader(false);
        Alert.alert(
          "Erreur",
          "La photo n'a pas pu être chargée. Veuillez réessayer.",
        );
      }
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

        <MapDebugInfo zoom={zoomRealtime ?? 0} />
        <MapLocationInfo zoneName={zoneName} />

        <PlaceDetailsSheet
          place={selectedPlace}
          onPressCamera={openCamera}
          onPressGallery={openGallery}
          onClose={onBottomSheetClose}
          animatedIndex={bottomSheetAnimatedIndex}
          scrollRepairNeededRef={scrollRepairNeededRef}
        />

        <AppReviewModal
          visible={isAppReviewModalVisible}
          onClose={onAppReviewClose}
        />
      </Box>
    </CustomScreenContainer>
  );
}
