import { type ImageSource } from "@vagabond/shared-utils";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactElement, useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
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
import { useUploadToast } from "@/hooks/other/useUploadToast";
import { trackEvent } from "@/lib/analytics/analytics";
import { mapService } from "@/services/MapService";
import { saveDraftPhoto } from "@/services/photoStorage";
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
    onUserTrackingModeChange,
    onPress,
    moveToUserLocation,
    resetMapOrientation,
    headingRealtime,
    zoomRealtime,
    isFollowingUser,
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

  // Upload progress toast (reacts to uploadingFilesAtom changes)
  useUploadToast();

  // App review modal
  const {
    isVisible: isAppReviewModalVisible,
    onClose: onAppReviewClose,
    onDismiss: onAppReviewDismiss,
  } = useAppReviewModal();

  // Track map screen load once per mount
  useEffect(() => {
    void trackEvent("map_viewed");
  }, []);

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
    const localPath = saveDraftPhoto(compressedUri);
    setCurrentPhoto({ imageUri: compressedUri, imageSource, localPath });
  };

  // Navigate to review form when a photo is selected (decoupled from picker flow)
  useEffect(() => {
    if (currentPhoto !== null && currentPhoto.imageUri !== "") {
      scrollRepairNeededRef.current = true;
      router.navigate("/validate-place/review-form");
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
        const compressedUri = await compressImage(asset.uri);
        const localPath = saveDraftPhoto(compressedUri);
        setCurrentPhoto({
          imageUri: compressedUri,
          imageSource: "CAMERA",
          localPath,
        });
        logger("[recoverPendingResult] success");
      } catch (error) {
        logger("[recoverPendingResult] recovery error:", error);
        Alert.alert(
          "Erreur",
          "La photo n'a pas pu être chargée. Veuillez réessayer.",
        );
      }
    };
    void recoverPendingResult();
  }, [setCurrentPhoto]);

  const openCamera = async (): Promise<void> => {
    if (selectedPlace !== null) {
      void trackEvent("poi_validation_started", {
        poi_id: selectedPlace.id,
        source: "camera",
      });
    }
    const cameraPermission =
      Platform.OS === "ios"
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
    const status = await request(cameraPermission);
    if (status !== RESULTS.GRANTED) {
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
      } catch (e) {
        setDisplayingLoader(false);
        logger("[postCamera] error parsing camera", e);
        Alert.alert(
          "Erreur",
          "La photo n'a pas pu être chargée. Veuillez réessayer.",
        );
      }
    }
  };

  const openGallery = async (): Promise<void> => {
    if (selectedPlace !== null) {
      void trackEvent("poi_validation_started", {
        poi_id: selectedPlace.id,
        source: "gallery",
      });
    }
    const photoPermission =
      Platform.OS === "ios"
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
    const status = await request(photoPermission);
    if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
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
      } catch (e) {
        setDisplayingLoader(false);
        logger("[postGallery] error parsing camera", e);
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
          isFollowingUser={isFollowingUser}
          onCameraChanged={onCameraChanged}
          onUserTrackingModeChange={onUserTrackingModeChange}
          onPress={onPress}
        />

        <MapButtons
          onCompassPress={resetMapOrientation}
          onLocatePress={() => {
            void trackEvent("map_recenter_pressed");
            moveToUserLocation();
          }}
          onFeedbackPress={() => {
            router.navigate({
              pathname: "/user-feedback",
              params: zoneName === null ? {} : { city: zoneName },
            });
          }}
          onSuggestPlacePress={() => {
            router.navigate({
              pathname: "/user-feedback/place-suggestion",
              params: zoneName === null ? {} : { city: zoneName },
            });
          }}
          isCentered={isFollowingUser}
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
          onDismiss={onAppReviewDismiss}
        />
      </Box>
    </CustomScreenContainer>
  );
}
