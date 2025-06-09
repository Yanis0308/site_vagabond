import { useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { type PermissionStatus } from "expo-modules-core/src/PermissionsInterface";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { PhotoStep, ReviewStep } from "@/components/validate-place";
import { selectedPlaceAtom } from "@/stores/selectedPlaceAtom";
import { logger } from "@/utils/logger";

interface Position {
  lat: number;
  lng: number;
}

const PlaceDetails = React.memo((): ReactElement => {
  const { t } = useTranslation("common");
  const { place: placeId } = useLocalSearchParams<{ place: string }>();
  logger("PlaceDetails", { placeId });
  const place = useAtomValue(selectedPlaceAtom);
  const [isLoading, setIsLoading] = useState(false);

  const [, setLocationPermissionStatus] = useState<PermissionStatus | null>(
    null,
  );
  const [position, setPosition] = useState<Position | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    imageUri: string;
    fileId: string;
  } | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Position par défaut pour éviter l'erreur useMemo conditionnel
  const defaultPosition = useMemo(() => ({ lat: 0, lng: 0 }), []);

  const onPhotoTaken = useCallback((imageUri: string, fileId: string): void => {
    setCapturedPhoto({ imageUri, fileId });
  }, []);

  const goBackToPhotoStep = useCallback((): void => {
    setCapturedPhoto(null);
  }, [setCapturedPhoto]);

  useEffect(() => {
    void (async (): Promise<void> => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status);
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission refusée",
          "Nous avons besoin d'accéder à votre position",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setPosition({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    void (async (): Promise<void> => {
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert(
            "Permission refusée",
            "Nous avons besoin d'accéder à votre caméra",
          );
        }
      }
    })();
  }, [cameraPermission, requestCameraPermission]);

  if (place === null) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-gray-600">
          {t("error_missing_place")}
        </Text>
      </Box>
    );
  }

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: themeColors.background["100"].hex,
          },
          headerTintColor: "black",
        }}
      />

      <KeyboardAwareScrollView
        bottomOffset={500}
        className="flex flex-1 bg-background-100"
        keyboardShouldPersistTaps="handled"
        disableScrollOnKeyboardHide
      >
        {capturedPhoto === null ? (
          <PhotoStep
            place={place}
            cameraPermission={cameraPermission}
            onPhotoTaken={onPhotoTaken}
            setIsLoading={setIsLoading}
          />
        ) : (
          <>
            <ReviewStep
              place={place}
              capturedImage={capturedPhoto.imageUri}
              position={position ?? defaultPosition}
              imageKey={capturedPhoto.fileId}
              setIsLoading={setIsLoading}
              onGoBack={goBackToPhotoStep}
            />
          </>
        )}
      </KeyboardAwareScrollView>

      {/* Overlay de chargement pendant la soumission */}
      {isLoading && (
        <View className="absolute inset-0 z-50">
          {/* Backdrop */}
          <View className="absolute inset-0 bg-black-500/30" />
          {/* Contenu du modal */}
          <View className="flex-1 items-center justify-center p-4">
            <View className="min-w-[200px] items-center rounded-xl bg-white p-8 shadow-2xl">
              <Spinner size="large" className="text-primary-600" />
              <Text className="mt-4 text-center font-medium text-gray-700">
                {"Chargement..."}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

export default PlaceDetails;

PlaceDetails.displayName = "PlaceDetails";
