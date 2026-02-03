import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useIsMutating } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React, { type ReactElement, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { ReviewStep } from "@/components/validate-place";
import {
  UPLOAD_FILE_MUTATION_KEY,
  useUploadFileMutation,
} from "@/hooks/mutations/useUploadFileMutation";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { currentPhotoAtom } from "@/stores/currentPhotoAtom";
import { compressImage } from "@/utils/imageCompressor";
import { logger } from "@/utils/logger";

export default function ReviewForm(): ReactElement {
  const { t } = useTranslation("common");
  const { selectedPlace } = usePlaceSelection();
  const currentPhoto = useAtomValue(currentPhotoAtom);
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const navigation = useNavigation();
  const router = useRouter();
  const uploadFileMutation = useUploadFileMutation();
  const isMutating = useIsMutating({
    mutationKey: UPLOAD_FILE_MUTATION_KEY,
  });
  const isUploading = isMutating > 0;
  const [uploadError, setUploadError] = useState(false);
  const uploadAttemptedRef = useRef(false);

  // Upload photo when component mounts
  useEffect(() => {
    if (
      currentPhoto !== null &&
      currentPhoto.fileId === null &&
      !isUploading &&
      !uploadError &&
      !uploadAttemptedRef.current
    ) {
      uploadAttemptedRef.current = true;
      void (async (): Promise<void> => {
        try {
          logger("Starting photo upload...");
          const compressedUri = await compressImage(currentPhoto.imageUri);

          const result = await uploadFileMutation.mutateAsync({
            uri: compressedUri,
            fileName: `photo_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
          });

          logger("Upload complete, fileId:", result.key);
          // update the current photo with the new fileId to register it in form
          setCurrentPhoto((prev) => {
            if (prev !== null) {
              return { ...prev, fileId: result.key };
            }
            return null;
          });
          uploadAttemptedRef.current = false;
        } catch (error) {
          logger("Error uploading photo:", error);
          setUploadError(true);
          uploadAttemptedRef.current = false;
          Alert.alert(
            "Erreur",
            "Impossible d'envoyer la photo. Voulez-vous réessayer ?",
            [
              {
                text: "Reprendre une photo",
                style: "cancel",
                onPress: (): void => {
                  setCurrentPhoto(null);
                  setUploadError(false);
                  navigation.goBack();
                },
              },
              {
                text: "Réessayer",
                onPress: (): void => {
                  setUploadError(false);
                },
              },
            ],
          );
        }
      })();
    }
  }, [
    currentPhoto,
    isUploading,
    uploadFileMutation,
    setCurrentPhoto,
    uploadError,
    navigation,
  ]);

  const handleReviewFormEnd = (): void => {
    setCurrentPhoto(null);
    // Small delay to ensure usePreventRemove is properly disabled
    setTimeout(() => {
      router.dismissAll();
    }, 0);
  };

  usePreventRemove(currentPhoto !== null, ({ data }) => {
    // Prompt the user before leaving the screen
    Alert.alert(
      "Refaire la photo ?",
      "Vous n'avez pas encore envoyé votre photo. Souhaitez-vous revenir en arrière pour en prendre une nouvelle ?",
      [
        {
          text: "Non",
          style: "cancel",
          onPress: (): void => {
            // Do nothing
          },
        },
        {
          text: "Oui",
          style: "destructive",
          onPress: (): void => {
            setCurrentPhoto(null);
            navigation.dispatch(data.action);
          },
        },
      ],
    );
  });

  if (selectedPlace === null || currentPhoto === null) {
    return (
      <Box className="flex-1 items-center justify-center p-4">
        <CustomText className="text-lg text-gray-600">
          {"review form" + t("error_missing_place")}
        </CustomText>
      </Box>
    );
  }

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["100"].hex}
      withHeader={true}
      isTabScreen={false}
    >
      <KeyboardAwareScrollView
        bottomOffset={500}
        className="flex flex-1"
        keyboardShouldPersistTaps="handled"
        disableScrollOnKeyboardHide
      >
        <ReviewStep
          place={selectedPlace}
          capturedImage={currentPhoto.imageUri}
          imageKey={currentPhoto.fileId}
          isUploading={isUploading}
          setReviewFormEnded={handleReviewFormEnd}
        />
      </KeyboardAwareScrollView>
    </CustomScreenContainer>
  );
}
