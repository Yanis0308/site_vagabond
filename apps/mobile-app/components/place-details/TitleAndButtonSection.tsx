import type { PoiEnrichedData } from "@vagabond/shared-utils";
import { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import Animated from "react-native-reanimated";

import { shadowStyles } from "@/styles/shadows";

import { CustomText } from "../custom-ui/CustomText";
import { Button, ButtonText } from "../ui/button";

interface TitleAndButtonSectionProps {
  enrichedData: PoiEnrichedData | undefined;
  placeName: string;
  isVisited: boolean;
  onPressCamera: () => Promise<void>;
  onPressGallery: () => Promise<void>;
  contentAnimatedStyle: {
    transform: Array<{ translateY: number }>;
  };
}

export function TitleAndButtonSection({
  enrichedData,
  placeName,
  isVisited,
  onPressCamera,
  onPressGallery,
  contentAnimatedStyle,
}: TitleAndButtonSectionProps): ReactElement {
  const { t } = useTranslation("common");

  return (
    <Animated.View
      style={[contentAnimatedStyle, shadowStyles.contentLarge]}
      className="bg-background-200 pb-2"
    >
      <CustomText type="placeTitle" className={"px-4 pt-4 text-plum-700"}>
        {isVisited ? " ✅ " : ""}
        {t("place_details_sheet.title", {
          name: enrichedData?.name ?? placeName,
        })}
      </CustomText>

      {isVisited ? null : (
        <>
          <Button onPress={onPressCamera} action="submit" className="mx-6 mt-4">
            <ButtonText>{"📸   Valider le lieu"}</ButtonText>
          </Button>
          <Pressable onPress={() => void onPressGallery()} className="mt-3">
            <CustomText className="text-center text-sm text-primary-500 underline">
              {"J'ai déjà une photo de ce lieu"}
            </CustomText>
          </Pressable>
        </>
      )}
    </Animated.View>
  );
}
