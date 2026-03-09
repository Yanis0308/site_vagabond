import BottomSheet, {
  type BottomSheetBackdropProps,
  type BottomSheetHandleProps,
  useBottomSheetScrollableCreator,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "expo-router";
import React, {
  type MutableRefObject,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { TABS_BAR_SPACING } from "@/styles/spacing";
import { type PoiType } from "@/utils/types";

import { themeColors } from "../ui/gluestack-ui-provider/config";
import { buildListData } from "./buildListData";
import { Handle } from "./Handle";
import {
  PlaceDetailsImagesProvider,
  usePlaceDetailsImagesContext,
} from "./PlaceDetailsImagesContext";
import { RenderListItem } from "./RenderListItem";

interface PlaceDetailsSheetV2Props {
  place: PoiType | null;
  onPressCamera: () => Promise<void>;
  onPressGallery: () => Promise<void>;
  onClose: () => void;
  onSheetChange?: (index: number) => void;
  animatedIndex?: SharedValue<number>;
  scrollRepairNeededRef?: MutableRefObject<boolean>;
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
  scrollRepairNeededRef,
}: PlaceDetailsSheetV2Props): ReactElement => {
  const DEFAULT_SNAP_POINT = 1;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [flashListKey, setFlashListKey] = useState(0);

  const BottomSheetScrollable = useBottomSheetScrollableCreator({
    //@ts-expect-error -- type are similar but not exactly the same
    //eslint-disable-next-line react-compiler/react-compiler -- needed by bottom-sheet
    focusHook: useFocusEffect,
  });

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

  // Force FlashList remount when returning from validation to fix iOS scroll corruption
  useFocusEffect(
    React.useCallback(() => {
      if (scrollRepairNeededRef?.current === true && place?.id !== undefined) {
        scrollRepairNeededRef.current = false;
        setFlashListKey((prev) => prev + 1);
      }
    }, [place?.id, scrollRepairNeededRef]),
  );

  useBottomSheetBack(place !== null, bottomSheetRef, onClose);

  const snapPoints = ["15%", "60%", "100%"];

  const backgroundStyle = {
    backgroundColor: themeColors.background["200"].hex,
    marginHorizontal: -2,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  };

  const visitedPois = visitedPoisData ?? [];

  const imageCount =
    enrichedData?.photos !== undefined
      ? enrichedData.photos.length
      : visitedPois.length;

  const placeDetailsImagesContext = usePlaceDetailsImagesContext(
    place?.id ?? "",
    imageCount,
  );
  const { hasNoVisibleImages } = placeDetailsImagesContext;

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
      hasNoVisibleImages ? [0, 0] : [-260, 0],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY }],
    };
  });

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
    <PlaceDetailsImagesProvider value={placeDetailsImagesContext}>
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
          key={flashListKey}
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
          style={{ paddingBottom: TABS_BAR_SPACING }}
        />
      </BottomSheet>
    </PlaceDetailsImagesProvider>
  );
};
