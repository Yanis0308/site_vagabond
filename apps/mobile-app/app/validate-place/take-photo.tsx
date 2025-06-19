import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React, { type ReactElement, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { PhotoStep } from "@/components/validate-place";
import { currentPhotoAtom } from "@/stores/currentPhotoAtom";
import { selectedPlaceAtom } from "@/stores/selectedPlaceAtom";
import { logger } from "@/utils/logger";

const PlaceDetails = React.memo((): ReactElement => {
  const { t } = useTranslation("common");
  const place = useAtomValue(selectedPlaceAtom);
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const router = useRouter();

  logger("take photo", place);

  const onPhotoTaken = useCallback(
    (imageUri: string, fileId: string): void => {
      setCurrentPhoto({ imageUri, fileId });
      router.push("/validate-place/review-form");
    },
    [setCurrentPhoto, router],
  );

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
      <Box className="flex-1 items-center justify-center">
        <Text className="text-lg text-gray-600">
          {"take photo" + t("error_missing_place")}
        </Text>
      </Box>
    );
  }

  return (
    <CustomScreenContainer
      isLightScreen={false}
      bgColor={"black"}
      withHeader={true}
      isTabScreen={false}
    >
      <PhotoStep
        cameraPermission={cameraPermission}
        onPhotoTaken={onPhotoTaken}
      />
    </CustomScreenContainer>
  );
});

export default PlaceDetails;

PlaceDetails.displayName = "PlaceDetails";
