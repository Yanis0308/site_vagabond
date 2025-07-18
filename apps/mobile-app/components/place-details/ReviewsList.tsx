import { memo, useMemo } from "react";
import { ScrollView } from "react-native-gesture-handler";

import { config } from "@/constants/Config";
import { logger } from "@/utils/logger";
import { type PoiType } from "@/utils/types";

import { PolaroidReview } from "../polaroid/PolaroidReview";

interface ReviewsListProps {
  poi: PoiType;
}

export const ReviewsList = memo(({ poi }: ReviewsListProps) => {
  logger(poi.visitedPois, "poi.visitedPois");

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
        imageUrl={`${config.cdnUrl}/square-photo.jpg`}
        username={"John Doe"}
        rating={2}
        dateString={"2025-01-01"}
        comment={
          "Praesent massa dui, accumsan et lobortis at, ornare vel lacus. Crasat, ornare vel lacus. Crasat, ornare vel lacus. Crasat, ornare vel lacus. Cras non libero metus. Maecenas accumsan odio et ipsum elementum finibus."
        }
      />,
    );

    items.push(
      <PolaroidReview
        key={"1234"}
        imageUrl={`${config.cdnUrl}/square-photo.jpg`}
        username={"John Doe"}
        rating={3}
        dateString={"2025-01-01"}
        comment={
          "Integer a velit eu nisi posuere tincidunt nec nec ligula. In massa dolor, tempor quis diam at, ornare bibendum sem."
        }
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
