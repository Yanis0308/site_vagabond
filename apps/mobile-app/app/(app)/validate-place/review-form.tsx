import { usePreventRemove } from "@react-navigation/native";
import { useIsMutating } from "@tanstack/react-query";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React, { type ReactElement, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
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

export default function ReviewForm(): ReactElement | null {
  const { t } = useTranslation("common");
  const { selectedPlace } = usePlaceSelection();
  const currentPhoto = useAtomValue(currentPhotoAtom);
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const [fileId, setFileId] = useState<string | null>(null);
  const navigation = useNavigation();
  const router = useRouter();
  const uploadFileMutation = useUploadFileMutation();
  const isMutating = useIsMutating({
    mutationKey: UPLOAD_FILE_MUTATION_KEY,
  });
  const isUploading = isMutating > 0;
  const [uploadError, setUploadError] = useState(false);
  const uploadAttemptedRef = useRef(false);

  const uploadPhoto = useCallback(async (): Promise<void> => {
    if (currentPhoto === null || fileId !== null) return;

    try {
      logger("Starting photo upload...");
      const compressedUri = await compressImage(currentPhoto.imageUri);

      const result = await uploadFileMutation.mutateAsync({
        uri: compressedUri,
        fileName: `photo_${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      });

      logger("Upload complete, fileId:", result.key);
      setFileId(result.key);
      uploadAttemptedRef.current = false;
    } catch (error) {
      logger("Error uploading photo:", error);
      setUploadError(true);
      uploadAttemptedRef.current = false;
      Alert.alert(
        t("review_form.upload_error_title"),
        t("review_form.upload_error_message"),
        [
          {
            text: t("review_form.upload_error_retake"),
            style: "cancel",
            onPress: (): void => {
              setCurrentPhoto(null);
              setUploadError(false);
              navigation.goBack();
            },
          },
          {
            text: t("review_form.upload_error_retry"),
            onPress: (): void => {
              setUploadError(false);
              void uploadPhoto();
            },
          },
        ],
      );
    }
  }, [
    currentPhoto,
    fileId,
    uploadFileMutation,
    t,
    setCurrentPhoto,
    navigation,
  ]);

  // Upload photo when screen gains focus with a photo to upload (event: user navigated here)
  useFocusEffect(
    useCallback(() => {
      if (
        currentPhoto !== null &&
        fileId === null &&
        !isUploading &&
        !uploadError &&
        !uploadAttemptedRef.current
      ) {
        uploadAttemptedRef.current = true;
        void uploadPhoto();
      }
    }, [currentPhoto, fileId, isUploading, uploadError, uploadPhoto]),
  );

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
      t("review_form.prevent_remove_title"),
      t("review_form.prevent_remove_message"),
      [
        {
          text: t("review_form.prevent_remove_cancel"),
          style: "cancel",
          onPress: (): void => {
            // Do nothing
          },
        },
        {
          text: t("review_form.prevent_remove_confirm"),
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
    return null;
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
          imageSource={currentPhoto.imageSource}
          imageKey={fileId}
          isUploading={isUploading}
          setReviewFormEnded={handleReviewFormEnd}
        />
      </KeyboardAwareScrollView>
    </CustomScreenContainer>
  );
}
