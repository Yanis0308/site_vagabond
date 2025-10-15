import { memo, useMemo } from "react";
import { ScrollView } from "react-native-gesture-handler";

import { config } from "@/constants/Config";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

import WeNeedYou from "../../assets/images/content/we-need-you.png";
import { PolaroidReview } from "../polaroid/PolaroidReview";

interface ReviewsListProps {
  poi: PoiType;
}

export const ReviewsList = memo(({ poi }: ReviewsListProps) => {

  const reviews = useMemo(() => {
    const items = poi.visitedPois.map((visitedPoi) => (
      <PolaroidReview
        key={visitedPoi.id}
        imageUrl={`${config.cdnUrl}/${visitedPoi.imageKey}`}
        username={visitedPoi.username}
        rating={visitedPoi.rating}
        dateString={visitedPoi.createdAt}
        comment={visitedPoi.comment}
      />
    ));
    items.push(
      <PolaroidReview
        key={"123"}
        imageUrl={WeNeedYou}
        username={"Jane Doe"}
        rating={undefined}
        dateString={new Date().toISOString()}
        comment={`Ajoutez votre propre avis ✍🏻\nC'est très simple !\nIl suffit d'appuyer sur le bouton "Valider le lieu" ci-dessus ☝`}
      />,
    );
    return items;
  }, [poi.visitedPois]);

  return (
    <ScrollView
      horizontal
      contentContainerClassName="flex flex-row gap-8 px-8 py-4"
    >
      {reviews}
    </ScrollView>
  );
});
ReviewsList.displayName = "ReviewsList";
