import {
  type BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
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
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";
import { Center } from "@/components/ui/center";
import { useBottomSheetBack } from "@/hooks/other/useBottomSheetBack";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useValidatedPlaces } from "@/hooks/queries/useValidatedPlaces";
import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";
import { localImages } from "@/utils/localImages";
import { type PoiType } from "@/utils/types";

import { CustomImage } from "../custom-ui/CustomImage";
import { CustomText } from "../custom-ui/CustomText";
import { ReviewsList } from "../place-details/ReviewsList";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
import { themeColors } from "../ui/gluestack-ui-provider/config";
import { StarRating } from "../validate-place/StarRating";
import { AdminInfoSection } from "./AdminInfoSection";
import { DescriptionSection } from "./DescriptionSection";
import { ExternalsButtonsSection } from "./ExternalsButtonsSection";
import { FunFactsSection } from "./FunFactsSection";
import { Handle } from "./Handle";
import { PlaceImage } from "./PlaceImage";

interface PlaceDetailsSheetV2Props {
  place: PoiType | null;
  onPressLink: () => void;
  onClose: () => void;
}

//TODO: utiliser le BottomSheet classique plutôt que la Modal pour éviter des Mount / Unmount ? La modal sert à en empiler plusieurs uniquement il me semble
export const PlaceDetailsSheet = memo(
  ({ place, onPressLink, onClose }: PlaceDetailsSheetV2Props): ReactElement => {
    const { t } = useTranslation("common");
    const DEFAULT_SNAP_POINT = 1;
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    const user = useUsersMe();
    const { data: validatedPlaces } = useValidatedPlaces();

    const animatedIndex = useSharedValue(0);
    const insets = useSafeAreaCustom();
    const [stickyHeaderIndices, setStickyHeaderIndices] = useState<number[]>(
      [],
    );

    useBottomSheetBack(place !== null, bottomSheetModalRef, onClose);

    const isVisited = useMemo(() => {
      return place?.visitedPois.some((visitedPoi) =>
        validatedPlaces?.some(
          (validatedPlace) => validatedPlace.poiId === visitedPoi.poiId,
        ),
      );
    }, [place, validatedPlaces]);

    useEffect(() => {
      if (place?.id !== undefined) {
        bottomSheetModalRef.current?.present();
        bottomSheetModalRef.current?.snapToIndex(DEFAULT_SNAP_POINT); // if already open, snap to the default snap point
      } else {
        bottomSheetModalRef.current?.close();
      }
    }, [place?.id]);

    const snapPoints = useMemo(() => ["15%", "60%", "90%"], []);

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
          [-16, 16],
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
          onClose={onClose}
        />
      ),
      [rating, onClose],
    );

    // Reel time update of stickyHeaderIndices
    useAnimatedReaction(
      // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- useAnimatedReaction ne peut pas utiliser useCallback
      () => {
        const currentIndex = Math.round(animatedIndex.value);
        return currentIndex === snapPoints.length - 1;
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
        {place === null ? null : (
          <BottomSheetScrollView
            stickyHeaderIndices={stickyHeaderIndices}
            key={place.id}
          >
            <Center className={"z-20 gap-5 px-6"}>
              <Animated.View
                style={[imageBoxAnimatedStyle, shadowStyles.ratingBlock]}
                className={cn("w-full rounded-2xl bg-background-50 p-2")}
              >
                <CustomImage
                  sources={localImages.starStruck}
                  useAppleWebpCodec={false}
                  height={60}
                  width={60}
                  containerClassName="absolute -left-5 -top-3 z-10 rotate-[-16deg]"
                  contentFit={"contain"}
                  showLoader={false}
                />
                <PlaceImage place={place} />
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
                <Button
                  onPress={onPressLink}
                  action="submit"
                  className="mx-6 mt-4"
                >
                  <ButtonText>{"📸   Valider le lieu"}</ButtonText>
                </Button>
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

              <ExternalsButtonsSection place={place} />

              <FunFactsSection className="px-6 pt-10" />

              <DescriptionSection
                className="px-6 pt-10"
                text={place.data[0]?.description}
              />

              {place.data[0] !== undefined && user.data?.role === "ADMIN" ? (
                <AdminInfoSection
                  placeId={place.id}
                  placeData={place.data[0]}
                />
              ) : null}
            </Box>

            <Box style={{ height: insets.bottom + 50 }} />
          </BottomSheetScrollView>
        )}
      </BottomSheetModal>
    );
  },
);

PlaceDetailsSheet.displayName = "PlaceDetailsSheet";
