import {
  type BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { type ExternalPathString } from "expo-router";
import React, {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";
import { CustomImage } from "@/components/custom-ui/CustomImage";
import { ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { useBottomSheetBack } from "@/hooks/other/useBottomSheetBack";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { useUser } from "@/hooks/other/useUser";
import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";
import { type PoiType } from "@/utils/types";

import { ButtonLink } from "../custom-ui/ButtonLink";
import { CustomButton } from "../custom-ui/CustomButton";
import { CustomText } from "../custom-ui/CustomText";
import { ReviewsList } from "../place-details/ReviewsList";
import { Box } from "../ui/box";
import { Divider } from "../ui/divider";
import { themeColors } from "../ui/gluestack-ui-provider/config";
import { StarRating } from "../validate-place/StarRating";
import { DescriptionSection } from "./DescriptionSection";
import { FunFactsSection } from "./FunFactsSection";
import { Handle } from "./Handle";

interface PlaceDetailsSheetV2Props {
  place: PoiType | null;
  onPressLink: () => void;
  onClose?: () => void;
}

//TODO: utiliser le BottomSheet classique plutôt que la Modal pour éviter des Mount / Unmount ? La modal sert à en empiler plusieurs uniquement il me semble
export const PlaceDetailsSheet = memo(
  ({ place, onPressLink, onClose }: PlaceDetailsSheetV2Props): ReactElement => {
    const { t } = useTranslation("common");
    const DEFAULT_SNAP_POINT = 1;
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const user = useUser();
    const animatedIndex = useSharedValue(0);
    const insets = useSafeAreaCustom();
    const [stickyHeaderIndices, setStickyHeaderIndices] = useState<number[]>(
      [],
    );

    useBottomSheetBack(place !== null, bottomSheetModalRef, onClose);

    const isVisited = useMemo(() => {
      return (
        place?.visitedPois.find(
          (visitedPoi) => visitedPoi.userId === user?.uid,
        ) !== undefined
      );
    }, [place, user]);

    useEffect(
      () => {
        if (place !== null) {
          bottomSheetModalRef.current?.present();
          bottomSheetModalRef.current?.snapToIndex(DEFAULT_SNAP_POINT);
        } else {
          bottomSheetModalRef.current?.close();
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- necessary
      [place?.id],
    );

    const snapPoints = useMemo(() => ["15%", "60%", "90%"], []);

    const navigationLink =
      Platform.select({
        ios: `maps://?q=${place?.data[0]?.name}&ll=${place?.coords.latitude},${place?.coords.longitude}`,
        android: `geo:${place?.coords.latitude},${place?.coords.longitude}?q=${place?.coords.latitude},${place?.coords.longitude}(${place?.data[0]?.name})`,
      }) ?? "";

    const backgroundStyle = useMemo(
      () => ({
        backgroundColor: themeColors.background["200"].hex,
        marginHorizontal: -2,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
      }),
      [],
    );

    const imageBoxAnimatedStyle = useAnimatedStyle(
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- mandatory for animation
      () => {
        const opacity = interpolate(
          animatedIndex.value,
          [0, 1],
          [0, 1],
          Extrapolation.CLAMP,
        );
        const translateY = interpolate(
          animatedIndex.value,
          [0, 1],
          [-50, 0],
          Extrapolation.CLAMP,
        );
        const marginTop = interpolate(
          animatedIndex.value,
          [0, 1],
          [0, 16],
          Extrapolation.CLAMP,
        );
        return {
          opacity,
          transform: [{ rotate: "2deg" }, { translateY }],
          marginTop,
        };
      },
    );

    const contentAnimatedStyle = useAnimatedStyle(
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- safe for testing
      () => {
        const translateY = interpolate(
          animatedIndex.value,
          [0, 1],
          [-260, 0], // Remonte pour combler l'espace de l'image
          Extrapolation.CLAMP,
        );
        return {
          transform: [{ translateY }],
        };
      },
    );

    const rating = useMemo(() => {
      return Math.round(
        place !== null
          ? place.visitedPois.reduce((acc, visitedPoi) => {
              return acc + visitedPoi.rating;
            }, 0) / place.visitedPois.length
          : 0,
      );
    }, [place]);

    const handleComponent = useCallback(
      ({ animatedIndex, animatedPosition }: BottomSheetHandleProps) => (
        <Handle
          animatedIndex={animatedIndex}
          animatedPosition={animatedPosition}
          rating={rating}
        />
      ),
      [rating],
    );

    // Reel time update of stickyHeaderIndices
    useAnimatedReaction(
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- useAnimatedReaction ne peut pas utiliser useCallback
      () => {
        const currentIndex = Math.round(animatedIndex.value);
        const lastIndex = 2; // Index du dernier snap point (90%)
        return currentIndex === lastIndex;
      },
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- useAnimatedReaction ne peut pas utiliser useCallback
      (isAtLastIndex) => {
        const newStickyIndices = isAtLastIndex ? [1] : [];
        runOnJS(setStickyHeaderIndices)(newStickyIndices);
      },
    );

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={DEFAULT_SNAP_POINT}
        snapPoints={snapPoints}
        animatedIndex={animatedIndex}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        backgroundStyle={backgroundStyle}
        handleComponent={handleComponent}
        bottomInset={TAB_BAR_HEIGHT}
      >
        {place !== null ? (
          <BottomSheetScrollView
            stickyHeaderIndices={stickyHeaderIndices}
            key={place.id}
          >
            <Center className={"z-20 gap-5 px-6"}>
              <Animated.View
                style={[imageBoxAnimatedStyle, shadowStyles.ratingBlock]}
                className={cn("w-full rounded-2xl bg-background-50 p-2")}
              >
                <Image
                  source={
                    "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Star%20Struck.webp"
                  }
                  className="absolute -left-5 -top-3 z-10 size-[60px] rotate-[-16deg]"
                />
                <CustomImage
                  source={`https://picsum.photos/seed/${place.id}/1000/1000`}
                  alt="Place photo illustration"
                  className={"h-[236px] w-full rounded-lg"}
                  contentFit={"cover"}
                />
              </Animated.View>
            </Center>

            <Animated.View
              style={[contentAnimatedStyle, shadowStyles.contentLarge]}
              className="bg-background-200 pb-2"
            >
              <CustomText
                type="placeTitle"
                className={"px-6 pt-4 text-plum-700"}
              >
                {isVisited ? " ✅ " : ""}
                {t("place_details_sheet.title", {
                  name: place.data[0]?.name,
                })}
              </CustomText>

              {isVisited ? null : (
                <CustomButton
                  label="✨ Valider le lieu"
                  onPress={onPressLink}
                  type="submit"
                  className="mx-6 mt-4"
                />
              )}
            </Animated.View>

            <Box>
              <StarRating
                rating={rating}
                size={18}
                className={cn("mb-4 self-center mt-8")}
                ratingCount={place.visitedPois.length}
              />

              <ReviewsList poi={place} />

              <FunFactsSection className="px-6 pt-10" />

              <DescriptionSection className="px-6 pt-10" />

              <Text size={"lg"} className="px-6">
                {place.data[0]?.description}
              </Text>

              {place.data[0] !== undefined ? (
                <Box className="flex gap-8 px-6">
                  <Box className="flex-row flex-wrap gap-2">
                    <ButtonLink
                      href={`https://www.google.com/search?q=${place.data[0].name}`}
                      className="rounded-full"
                    >
                      <ButtonText>
                        {t("place_details_sheet.search_on_google")}
                      </ButtonText>
                    </ButtonLink>
                    <ButtonLink
                      href={`https://www.google.com/maps/search/?api=1&query=${place.data[0].name}`}
                      className="rounded-full"
                    >
                      <ButtonText>
                        {t("place_details_sheet.search_on_google")}
                      </ButtonText>
                    </ButtonLink>
                    <ButtonLink
                      href={navigationLink as ExternalPathString}
                      className="rounded-full"
                    >
                      <ButtonText>
                        {t("place_details_sheet.navigate_to_place")}
                      </ButtonText>
                    </ButtonLink>
                    <ButtonLink
                      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                      href={`https://www.wikipedia.org/wiki/${place.data[0].rawInfo?.wikipedia}`}
                      className="rounded-full"
                      isDisabled={
                        //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                        place.data[0].rawInfo?.wikipedia === undefined
                      }
                    >
                      <ButtonText>
                        {t("place_details_sheet.search_on_wikipedia")}
                      </ButtonText>
                    </ButtonLink>
                    <ButtonLink
                      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                      href={`https://www.wikidata.org/wiki/${place.data[0].rawInfo?.wikidata}`}
                      className="rounded-full"
                      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
                      isDisabled={place.data[0].rawInfo?.wikidata === undefined}
                    >
                      <ButtonText>
                        {t("place_details_sheet.search_on_wikidata")}
                      </ButtonText>
                    </ButtonLink>
                  </Box>
                  <Divider />
                  <Box className="flex">
                    {
                      //eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- safe for testing
                      Object.entries(place.data[0].rawInfo).map(
                        ([key, value]) => (
                          <Text key={key}>
                            {/* @ts-expect-error safe for testing */}
                            {key}: {value}
                          </Text>
                        ),
                      )
                    }
                  </Box>
                </Box>
              ) : null}
            </Box>
            <Box style={{ height: insets.bottom }} />
          </BottomSheetScrollView>
        ) : null}
      </BottomSheetModal>
    );
  },
);

PlaceDetailsSheet.displayName = "PlaceDetailsSheet";
