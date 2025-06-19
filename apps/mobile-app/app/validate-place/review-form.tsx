import { useNavigation, usePreventRemove } from "@react-navigation/native";
import * as Location from "expo-location";
import { type PermissionStatus } from "expo-modules-core/src/PermissionsInterface";
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

interface Position {
  lat: number;
  lng: number;
}

const PlaceDetails = React.memo((): ReactElement => {
  const { t } = useTranslation("common");
  const place = useAtomValue(selectedPlaceAtom);
  const currentPhoto = useAtomValue(currentPhotoAtom);
  const setCurrentPhoto = useSetAtom(currentPhotoAtom);
  const navigation = useNavigation();
  const router = useRouter();
  const [reviewFormEnded, setReviewFormEnded] = useState(false);

  const [, setLocationPermissionStatus] = useState<PermissionStatus | null>(
    null,
  );
  const [position, setPosition] = useState<Position>({ lat: 0, lng: 0 });

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
    if (reviewFormEnded) {
      router.dismissAll();
    }
  }, [reviewFormEnded, router]);

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
          position={position}
          imageKey={currentPhoto.fileId}
          setReviewFormEnded={setReviewFormEnded}
        />
      </KeyboardAwareScrollView>
    </CustomScreenContainer>
  );
});

export default PlaceDetails;

PlaceDetails.displayName = "PlaceDetails";
