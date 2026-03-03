import BottomSheet, {
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
  useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import React, { type ReactElement, useEffect, useRef } from "react";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { TAB_BAR_HEIGHT } from "@/app/(app)/(tabs)/_layout";
import { useBottomSheetBack } from "@/hooks/other/useBottomSheetBack";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { usePoiEnriched } from "@/hooks/queries/usePoiEnriched";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useUserVisitedPois } from "@/hooks/queries/useUserVisitedPois";
import { useVisitedPois } from "@/hooks/queries/useVisitedPois";
import { type PoiType } from "@/utils/types";

import { themeColors } from "../ui/gluestack-ui-provider/config";
import { buildListData } from "./buildListData";
import { Handle } from "./Handle";
import { RenderListItem } from "./RenderListItem";

interface PlaceDetailsSheetV2Props {
  place: PoiType | null;
  onPressCamera: () => Promise<void>;
  onPressGallery: () => Promise<void>;
  onClose: () => void;
  onSheetChange?: (index: number) => void;
  animatedIndex?: SharedValue<number>;
}

const SheetBackdrop = ({
  animatedIndex,
  style,
}: BottomSheetBackdropProps): ReactElement => {
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedIndex.value,
      [0, 1, 2],
      [0, 0, 0.3],
      Extrapolation.CLAMP,
    );

    return { opacity };
  });

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

export const PlaceDetailsSheet = ({
  place,
  onPressCamera,
  onPressGallery,
  onClose,
  onSheetChange,
  animatedIndex,
}: PlaceDetailsSheetV2Props): ReactElement => {
  const DEFAULT_SNAP_POINT = 1;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const BottomSheetScrollable = useBottomSheetScrollableCreator();

  const user = useUsersMe();
  const {
    data: { visitedPoiIds },
  } = useUserVisitedPois();
  const { data: enrichedData, isLoading: isLoadingEnriched } = usePoiEnriched(
    place?.id ?? null,
  );
  const { data: visitedPoisData } = useVisitedPois(place?.id ?? null);

  const internalAnimatedIndex = useSharedValue(-1);
  const bottomSheetAnimatedIndex = animatedIndex ?? internalAnimatedIndex;
  const insets = useSafeAreaCustom();

  const isVisited = place !== null ? visitedPoiIds.includes(place.id) : false;

  useEffect(() => {
    if (place?.id !== undefined) {
      bottomSheetRef.current?.snapToIndex(DEFAULT_SNAP_POINT);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [place?.id]);

  useBottomSheetBack(place !== null, bottomSheetRef, onClose);

  const snapPoints = ["15%", "60%", "100%"];

  const backgroundStyle = {
    backgroundColor: themeColors.background["200"].hex,
    marginHorizontal: -2,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  };

  const imageBoxAnimatedStyle = useAnimatedStyle(() => {
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
      transform: [{ translateY }],
      marginTop,
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      bottomSheetAnimatedIndex.value,
      [0, 1],
      [-260, 0], // Remonte pour combler l'espace de l'image
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY }],
    };
  });

  const visitedPois = visitedPoisData ?? [];

  // prettier-ignore
  const rating = Math.round(
    visitedPois.length > 0
      ? visitedPois.reduce((acc, visitedPoi) => {
        return acc + visitedPoi.rating;
      }, 0) / visitedPois.length
      : enrichedData?.popularity?.rating !== undefined
        ? Math.round(enrichedData.popularity.rating)
        : 0,
  );

  const ratingCount =
    visitedPois.length > 0
      ? visitedPois.length
      : (enrichedData?.popularity?.reviewCount ?? 0);

  const handleComponent = ({
    animatedIndex,
    animatedPosition,
  }: BottomSheetHandleProps): ReactElement => {
    return (
      <Handle
        animatedIndex={animatedIndex}
        animatedPosition={animatedPosition}
        rating={rating}
        onClose={onClose}
      />
    );
  };

  const listData = buildListData({
    place,
    enrichedData: enrichedData ?? undefined,
    isVisited,
    rating,
    ratingCount,
    userRole: user.data?.role,
    insets,
    isLoadingEnriched,
  });

  const keyExtractor = (
    item: ReturnType<typeof buildListData>[number],
    index: number,
  ): string => {
    return `${item.type}-${index}`;
  };

  const stickyHeaderIndices = [1];

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
      <FlashList
        data={listData}
        renderItem={({ item }) => (
          <RenderListItem
            item={item}
            enrichedData={enrichedData ?? undefined}
            onPressCamera={onPressCamera}
            onPressGallery={onPressGallery}
            imageBoxAnimatedStyle={imageBoxAnimatedStyle}
            contentAnimatedStyle={contentAnimatedStyle}
            visitedPois={visitedPois}
            isLoadingEnriched={isLoadingEnriched}
          />
        )}
        keyExtractor={keyExtractor}
        stickyHeaderIndices={stickyHeaderIndices}
        renderScrollComponent={BottomSheetScrollable}
      />
    </BottomSheet>
  );
};
