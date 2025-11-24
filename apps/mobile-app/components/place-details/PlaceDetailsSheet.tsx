import BottomSheet, {
  type BottomSheetBackdropProps,
  BottomSheetFlashList,
  type BottomSheetHandleProps,
} from "@gorhom/bottom-sheet";
import React, {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";
import { Center } from "@/components/ui/center";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useUserZoneStats } from "@/hooks/queries/useZonesStats";
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
  onSheetChange?: (index: number) => void;
}

type ListItemType =
  | { type: "header"; data: PoiType }
  | { type: "titleAndButton"; data: PoiType; isVisited: boolean }
  | { type: "rating"; rating: number; count: number }
  | { type: "reviews"; data: PoiType }
  | { type: "externals"; data: PoiType }
  | { type: "funFacts" }
  | { type: "description"; text?: string }
  | { type: "admin"; placeId: string; placeData: PoiType["data"][0] }
  | { type: "spacer"; height: number };

const SheetBackdrop = ({
  animatedIndex,
  style,
}: BottomSheetBackdropProps): ReactElement => {
  const backdropAnimatedStyle = useAnimatedStyle(
    // eslint-disable-next-line @arthurgeron/react-usememo/require-usememo -- mandatory for animation
    () => {
      const opacity = interpolate(
        animatedIndex.value,
        [0, 1, 2],
        [0, 0, 0.3],
        Extrapolation.CLAMP,
      );

      return { opacity };
    },
  );

  return (
    <Animated.View
      style={[
        style,
        backdropAnimatedStyle,
        {
          backgroundColor: "black",
        },
      ]}
      pointerEvents="none"
    />
  );
};

export const PlaceDetailsSheet = memo(
  ({
    place,
    onPressLink,
    onClose,
    onSheetChange,
  }: PlaceDetailsSheetV2Props): ReactElement => {
    const { t } = useTranslation("common");
    const DEFAULT_SNAP_POINT = 1;
    const bottomSheetRef = useRef<BottomSheet>(null);

    const user = useUsersMe();
    const { data: zonesData } = useUserZoneStats();
    const visitedPoisByPoiIdMap = zonesData?.visitedPoisByPoiIdMap;

    const bottomSheetAnimatedIndex = useSharedValue(0);
    const insets = useSafeAreaCustom();

    const isVisited = useMemo(() => {
      if (place === null || visitedPoisByPoiIdMap === undefined) {
        return false;
      }

      return place.visitedPois.some((visitedPoi) =>
        visitedPoisByPoiIdMap.has(visitedPoi.poiId),
      );
    }, [place, visitedPoisByPoiIdMap]);

    useEffect(() => {
      if (place?.id !== undefined) {
        bottomSheetRef.current?.snapToIndex(DEFAULT_SNAP_POINT);
      } else {
        bottomSheetRef.current?.close();
      }
    }, [place?.id]);

    const snapPoints = useMemo(() => ["15%", "60%", "100%"], []);

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
          bottomSheetAnimatedIndex.value,
          [0, 1],
          [0, 1],
          Extrapolation.CLAMP,
        );
        const translateY = interpolate(
          bottomSheetAnimatedIndex.value,
          [0, 1],
          [-50, 0],
          Extrapolation.CLAMP,
        );
        const marginTop = interpolate(
          bottomSheetAnimatedIndex.value,
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
          bottomSheetAnimatedIndex.value,
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

    const listData = useMemo<ListItemType[]>(() => {
      if (place === null) return [];

      const items: ListItemType[] = [
        { type: "header", data: place },
        { type: "titleAndButton", data: place, isVisited: isVisited ?? false },
        { type: "rating", rating, count: place.visitedPois.length },
        { type: "reviews", data: place },
        { type: "externals", data: place },
        { type: "funFacts" },
        { type: "description", text: place.data[0]?.description },
      ];

      const placeData = place.data[0];
      if (
        placeData !== null &&
        placeData !== undefined &&
        user.data?.role === "ADMIN"
      ) {
        items.push({
          type: "admin",
          placeId: place.id,
          placeData,
        });
      }

      items.push({ type: "spacer", height: insets.bottom + 50 });

      return items;
    }, [place, isVisited, rating, user.data?.role, insets.bottom]);

    const renderItem = useCallback(
      ({ item }: { item: ListItemType }) => {
        switch (item.type) {
          case "header":
            return (
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
                  <PlaceImage place={item.data} />
                </Animated.View>
              </Center>
            );

          case "titleAndButton":
            return (
              <Animated.View
                style={[contentAnimatedStyle, shadowStyles.contentLarge]}
                className="bg-background-200 pb-2"
              >
                <CustomText
                  type="placeTitle"
                  className={"px-6 pt-4 text-plum-700"}
                >
                  {item.isVisited ? " ✅ " : ""}
                  {t("place_details_sheet.title", {
                    name: item.data.data[0]?.name,
                  })}
                </CustomText>

                {item.isVisited ? null : (
                  <Button
                    onPress={onPressLink}
                    action="submit"
                    className="mx-6 mt-4"
                  >
                    <ButtonText>{"📸   Valider le lieu"}</ButtonText>
                  </Button>
                )}
              </Animated.View>
            );

          case "rating":
            return (
              <StarRating
                rating={item.rating}
                size={18}
                className={cn("mb-4 self-center mt-8")}
                ratingCount={item.count}
              />
            );

          case "reviews":
            return <ReviewsList poi={item.data} />;

          case "externals":
            return <ExternalsButtonsSection place={item.data} />;

          case "funFacts":
            return <FunFactsSection className="px-6 pt-10" />;

          case "description":
            return (
              <DescriptionSection className="px-6 pt-10" text={item.text} />
            );

          case "admin":
            return (
              <AdminInfoSection
                placeId={item.placeId}
                placeData={item.placeData}
              />
            );

          case "spacer":
            return <Box style={{ height: item.height }} />;

          default:
            return null;
        }
      },
      [imageBoxAnimatedStyle, contentAnimatedStyle, t, onPressLink],
    );

    const keyExtractor = useCallback((item: ListItemType, index: number) => {
      return `${item.type}-${index}`;
    }, []);

    const stickyHeaderIndices = useMemo(() => {
      return [1];
    }, []);

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        animatedIndex={bottomSheetAnimatedIndex}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        backgroundStyle={backgroundStyle}
        handleComponent={handleComponent}
        backdropComponent={SheetBackdrop}
        bottomInset={TAB_BAR_HEIGHT}
        onChange={onSheetChange}
        topInset={insets.top}
      >
        <BottomSheetFlashList
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          stickyHeaderIndices={stickyHeaderIndices}
        />
      </BottomSheet>
    );
  },
);

PlaceDetailsSheet.displayName = "PlaceDetailsSheet";
