import { FlashList } from "@shopify/flash-list";
import { cssInterop } from "nativewind";
import { memo, useCallback, useMemo } from "react";
import { FlatList } from "react-native-gesture-handler";

import { config } from "@/constants/Config";
import { localImages } from "@/utils/localImages";
import { type PoiType } from "@/utils/types";

import { PolaroidReview } from "../polaroid/PolaroidReview";

cssInterop(FlashList, { contentContainerClassName: "contentContainerStyle" });

interface ReviewsListProps {
  poi: PoiType;
}

interface ReviewItem {
  id: string;
  imageUrl: string | number;
  username: string;
  rating: number;
  createdAt: string;
  comment: string;
}

export const ReviewsList = memo(({ poi }: ReviewsListProps) => {
  const reviewsData: ReviewItem[] = useMemo(() => {
    return [
      ...poi.visitedPois.map((visitedPoi) => ({
        id: visitedPoi.id.toString(),
        imageUrl: `${config.cdnUrl}/${visitedPoi.imageKey}`,
        username: visitedPoi.username,
        rating: visitedPoi.rating,
        createdAt: visitedPoi.createdAt,
        comment: visitedPoi.comment,
      })),
      {
        id: "123",
        imageUrl: localImages.weNeedYou,
        username: "Jane Doe",
        rating: 0,
        createdAt: new Date().toISOString(),
        comment: `Ajoutez votre propre avis ✍🏻\nC'est très simple !\nIl suffit d'appuyer sur le bouton "Valider le lieu" ci-dessus ☝`,
      },
    ];
  }, [poi.visitedPois]);

  const renderItem = useCallback(
    ({ item }: { item: ReviewItem }) => (
      <PolaroidReview
        imageUrl={item.imageUrl}
        username={item.username}
        rating={item.rating}
        dateString={item.createdAt}
        comment={item.comment}
        className="mr-4"
      />
    ),
    [],
  );
  const keyExtractor = useCallback((item: ReviewItem) => item.id, []);

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
