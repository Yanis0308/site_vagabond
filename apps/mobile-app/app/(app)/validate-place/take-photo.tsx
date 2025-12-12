import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import React, { type ReactElement, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { PhotoStep } from "@/components/validate-place";
import { useUploadFileMutation } from "@/hooks/mutations/useUploadFileMutation";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { currentPhotoAtom } from "@/stores/currentPhotoAtom";
import { compressImage } from "@/utils/imageCompressor";
import { logger } from "@/utils/logger";

const PlaceDetails = React.memo((): ReactElement => {
  const { t } = useTranslation("common");
  const { selectedPlace } = usePlaceSelection();
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const router = useRouter();
  const uploadFileMutation = useUploadFileMutation();

  const onPhotoTaken = useCallback(
    (imageUri: string): void => {
      setCurrentPhoto({ imageUri, fileId: null });
      router.push("/validate-place/review-form");

      // Start uploading in background
      void (async (): Promise<void> => {
        try {
          logger("Starting photo upload...");
          const compressedUri = await compressImage(imageUri);

          const result = await uploadFileMutation.mutateAsync({
            uri: compressedUri,
            fileName: `photo_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
          });

          logger("Upload complete, fileId:", result.key);
          setCurrentPhoto((prev) => {
            if (prev !== null) {
              return { ...prev, fileId: result.key };
            }
            return null;
          });
        } catch (error) {
          logger("Error uploading photo:", error);
          Alert.alert("Erreur", "Impossible d'envoyer la photo");
        }
      })();
    },
    [setCurrentPhoto, router, uploadFileMutation],
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

  if (selectedPlace === null) {
    return (
      <Box className="flex-1 items-center justify-center">
        <CustomText className="text-lg text-gray-600">
          {"take photo" + t("error_missing_place")}
        </CustomText>
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
