import { FlashList } from "@shopify/flash-list";
import { cssInterop } from "nativewind";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native-gesture-handler";

import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { useVisitedPois } from "@/hooks/queries/useVisitedPois";
import { resolveVisitedPoiImageUrl } from "@/services/photoStorage";
import { localImages } from "@/utils/localImages";

import { PolaroidReview } from "../polaroid/PolaroidReview";

cssInterop(FlashList, { contentContainerClassName: "contentContainerStyle" });

interface ReviewsListProps {
  poiId: string;
}

interface ReviewItem {
  id: number;
  poiId: string;
  imageUrl: string | number;
  username: string;
  deletable: boolean;
  rating: number;
  createdAt: string;
  comment: string | null;
}

export const ReviewsList = memo(({ poiId }: ReviewsListProps) => {
  const { t } = useTranslation("common");
  const { data: currentUser } = useUsersMe();
  const {
    data: visitedPois,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVisitedPois(poiId);

  // v2 : les pages arrivent triées par created_at DESC depuis l'API (cursor pagination).
  // Pas besoin de re-trier côté client.
  const reviewsData: ReviewItem[] = useMemo(() => {
    const items = (visitedPois ?? []).map((visitedPoi) => ({
      id: visitedPoi.id,
      poiId: visitedPoi.poiId,
      imageUrl:
        resolveVisitedPoiImageUrl(
          visitedPoi,
          currentUser?.id === visitedPoi.userId,
        ) ?? localImages.noPhotoPlaceholder,
      username: visitedPoi.username,
      deletable: currentUser?.id === visitedPoi.userId,
      rating: visitedPoi.rating,
      createdAt: visitedPoi.createdAt,
      comment: visitedPoi.comment,
    }));
    return [
      ...items,
      {
        id: 123,
        poiId: "",
        imageUrl: localImages.weNeedYou,
        username: t("reviews_list.placeholder_username"),
        deletable: false,
        rating: 0,
        createdAt: new Date().toISOString(),
        comment: t("reviews_list.placeholder_comment"),
      },
    ];
  }, [visitedPois, currentUser, t]);

  const renderItem = useCallback(
    ({ item }: { item: ReviewItem }) => (
      <PolaroidReview
        id={item.id}
        poiId={item.poiId}
        imageUrl={item.imageUrl}
        username={item.username}
        deletable={item.deletable}
        rating={item.rating}
        dateString={item.createdAt}
        comment={item.comment ?? ""}
        className="mr-4"
      />
    ),
    [],
  );
  const keyExtractor = useCallback(
    (item: ReviewItem) => item.id.toString(),
    [],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListFooterComponent = useCallback(
    () =>
      hasNextPage ? (
        <Box className="h-full w-[60vw] items-center justify-center px-4">
          {isFetchingNextPage ? (
            <Spinner size="large" color={themeColors.primary[500].hex} />
          ) : null}
        </Box>
      ) : null,
    [hasNextPage, isFetchingNextPage],
  );

  // We use FlatList from react-native-gesture-handler because we are inside a BottomSheet
  // and nested FlashList is not working properly in this case
  return (
    <FlatList
      data={reviewsData}
      horizontal
      contentContainerClassName="px-8 py-4"
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={ListFooterComponent}
    />
  );
});
ReviewsList.displayName = "ReviewsList";
