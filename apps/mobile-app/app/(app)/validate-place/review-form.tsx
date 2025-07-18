import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Text } from "@/components/ui/text";
import { ReviewStep } from "@/components/validate-place";
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
  const [reviewFormEnded, setReviewFormEnded] = useState(false);

  useEffect(() => {
    if (reviewFormEnded) {
      setCurrentPhoto(null);
      // Small delay to ensure usePreventRemove is properly disabled
      setTimeout(() => {
        router.dismissAll();
      }, 0);
    }
  }, [reviewFormEnded, router, setCurrentPhoto]);

  usePreventRemove(
    !reviewFormEnded,
    useCallback(
      ({ data }) => {
        // Prompt the user before leaving the screen
        Alert.alert(
          "Discard changes?",
          "You have unsaved changes. Discard them and leave the screen?",
          [
            {
              text: "Don't leave",
              style: "cancel",
              onPress: (): void => {
                // Do nothing
              },
            },
            {
              text: "Discard",
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
        <Text className="text-lg text-gray-600">
          {"review form" + t("error_missing_place")}
        </Text>
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
          setReviewFormEnded={setReviewFormEnded}
        />
      </KeyboardAwareScrollView>
    </CustomScreenContainer>
  );
}
