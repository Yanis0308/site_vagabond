import { FlashList } from "@shopify/flash-list";
import type { VisitedPoi } from "@vagabond/shared-utils";
import { cssInterop } from "nativewind";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native-gesture-handler";

import { config } from "@/constants/Config";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { localImages } from "@/utils/localImages";

import { PolaroidReview } from "../polaroid/PolaroidReview";

cssInterop(FlashList, { contentContainerClassName: "contentContainerStyle" });

interface ReviewsListProps {
  visitedPois: VisitedPoi[];
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

export const ReviewsList = memo(({ visitedPois }: ReviewsListProps) => {
  const { t } = useTranslation("common");
  const { data: currentUser } = useUsersMe();

  const reviewsData: ReviewItem[] = [
    ...visitedPois.map((visitedPoi) => ({
      id: visitedPoi.id,
      poiId: visitedPoi.poiId,
      imageUrl: `${config.cdnUrl}/${visitedPoi.imageKey}`,
      username: visitedPoi.username,
      deletable: currentUser?.id === visitedPoi.userId,
      rating: visitedPoi.rating,
      createdAt: visitedPoi.createdAt,
      comment: visitedPoi.comment,
    })),
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

  // We use FlatList from react-native-gesture-handler because we are inside a BottomSheet
  // and nested FlashList is not working properly in this case
  return (
    <FlatList
      data={reviewsData}
      horizontal
      contentContainerClassName="px-8 py-4"
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  );
});
ReviewsList.displayName = "ReviewsList";
