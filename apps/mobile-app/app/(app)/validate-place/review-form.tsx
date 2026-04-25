import { usePreventRemove } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React, { type ReactElement, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { ReviewStep } from "@/components/validate-place";
import { queryClient } from "@/constants/QueryClient";
import { useBackgroundPhotoUpload } from "@/hooks/mutations/useBackgroundPhotoUpload";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { trackEvent } from "@/lib/analytics/analytics";
import { queuePhotoForUpload } from "@/services/photoStorage";
import { currentPhotoAtom } from "@/stores/currentPhotoAtom";
import { displayingLoaderAtom } from "@/stores/displayingLoaderAtom";
import { shouldShowAppReviewAtom } from "@/stores/shouldShowAppReviewAtom";
import { logger } from "@/utils/logger";

export default function ReviewForm(): ReactElement | null {
  const { t } = useTranslation("common");
  const { selectedPlace } = usePlaceSelection();
  const currentPhoto = useAtomValue(currentPhotoAtom);
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const setShouldShowAppReview = useSetAtom(shouldShowAppReviewAtom);
  const navigation = useNavigation();
  const router = useRouter();
  const { mutate: uploadPhotoInBackground } = useBackgroundPhotoUpload();
  const setDisplayingLoader = useSetAtom(displayingLoaderAtom);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayingLoader(false);
    return (): void => {
      if (dismissTimeoutRef.current !== null) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [setDisplayingLoader]);

  const handleValidated = async (visitedPoiId: number): Promise<void> => {
    logger(`[ReviewForm] Validated with visitedPoiId: ${visitedPoiId}`);

    if (currentPhoto?.localPath !== undefined) {
      try {
        const queuedUri = queuePhotoForUpload(
          currentPhoto.localPath,
          visitedPoiId,
        );
        if (selectedPlace !== null) {
          void trackEvent("photo_upload_started", {
            poi_id: selectedPlace.id,
            source:
              currentPhoto.imageSource === "CAMERA" ? "camera" : "gallery",
          });
        }
        uploadPhotoInBackground({ localUri: queuedUri, visitedPoiId });
      } catch (error) {
        logger("[ReviewForm] Failed to rename/start upload:", error);
      }
    }

    await queryClient
      .refetchQueries({ queryKey: ["user-visited-pois"] })
      .then(() => {
        setShouldShowAppReview(true);
      });
    setCurrentPhoto(null);
    dismissTimeoutRef.current = setTimeout(() => {
      dismissTimeoutRef.current = null;
      router.dismissAll();
    }, 0);
  };

  usePreventRemove(currentPhoto !== null, ({ data }) => {
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
            if (selectedPlace !== null) {
              void trackEvent("poi_validation_cancelled", {
                poi_id: selectedPlace.id,
              });
            }
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
          onValidated={(id) => void handleValidated(id)}
        />
      </KeyboardAwareScrollView>
    </CustomScreenContainer>
  );
}
