import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useIsMutating } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React, { type ReactElement, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { ReviewStep } from "@/components/validate-place";
import { UPLOAD_FILE_MUTATION_KEY } from "@/hooks/mutations/useUploadFileMutation";
import { currentPhotoAtom } from "@/stores/currentPhotoAtom";
import { selectedPlaceAtom } from "@/stores/selectedPlaceAtom";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- page file
export default function ReviewForm(): ReactElement {
  const { t } = useTranslation("common");
  const place = useAtomValue(selectedPlaceAtom);
  const currentPhoto = useAtomValue(currentPhotoAtom);
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const navigation = useNavigation();
  const router = useRouter();
  const isMutating = useIsMutating(
    useMemo(() => ({ mutationKey: UPLOAD_FILE_MUTATION_KEY }), []),
  );
  const isUploading = isMutating > 0;

  const handleReviewFormEnd = useCallback(() => {
    setCurrentPhoto(null);
    // Small delay to ensure usePreventRemove is properly disabled
    setTimeout(() => {
      router.dismissAll();
    }, 0);
  }, [router, setCurrentPhoto]);

  usePreventRemove(
    currentPhoto !== null,
    useCallback(
      ({ data }) => {
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
      },
      [navigation, setCurrentPhoto],
    ),
  );

  if (place === null || currentPhoto === null) {
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
          place={place}
          capturedImage={currentPhoto.imageUri}
          imageKey={currentPhoto.fileId}
          isUploading={isUploading}
          setReviewFormEnded={handleReviewFormEnd}
        />
      </KeyboardAwareScrollView>
    </CustomScreenContainer>
  );
}
