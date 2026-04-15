import type { PoiEnrichedData, VisitedPoi } from "@vagabond/shared-utils";
import { type PoiEnrichedPhoto } from "@vagabond/shared-utils/dist/schemas/processors/llm";
import { type ReactElement } from "react";
import Animated from "react-native-reanimated";

import { Center } from "@/components/ui/center";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { resolveVisitedPoiImageUrl } from "@/services/photoStorage";
import { localImages } from "@/utils/localImages";

import { CustomImage } from "../custom-ui/CustomImage";
import { PhotosLoadingPlaceholder } from "./PhotosLoadingPlaceholder";
import { PhotosSection } from "./PhotosSection";
import { usePlaceDetailsImages } from "./PlaceDetailsImagesContext";

interface HeaderSectionProps {
  enrichedData: PoiEnrichedData | undefined;
  visitedPois: VisitedPoi[];
  isLoadingEnriched: boolean;
  imageBoxAnimatedStyle: {
    opacity: number;
    transform: Array<{ translateY: number }>;
    marginTop: number;
  };
}

const consolidatePhotos = (
  enrichedData: PoiEnrichedData | undefined,
  visitedPois: VisitedPoi[],
  currentUserId: string | undefined,
): PoiEnrichedPhoto[] => {
  const photos: PoiEnrichedPhoto[] = [];
  const hasEnrichedPhotos =
    enrichedData?.photos !== undefined && enrichedData.photos.length > 0;

  if (hasEnrichedPhotos && enrichedData.photos !== undefined) {
    photos.push(...enrichedData.photos);
  }
  if (photos.length === 0 && visitedPois.length > 0) {
    visitedPois.forEach((visitedPoi, index) => {
      const imageUrl = resolveVisitedPoiImageUrl(
        visitedPoi,
        currentUserId === visitedPoi.userId,
      );
      if (imageUrl === null) {
        return;
      }
      const photo: PoiEnrichedPhoto = {
        url: imageUrl,
        caption: visitedPoi.comment ?? "",
        credit: "",
        isPrimary: index === 0,
      };
      photos.push(photo);
    });
  }

  return photos;
};

export const HeaderSection = ({
  isLoadingEnriched,
  imageBoxAnimatedStyle,
  enrichedData,
  visitedPois,
}: HeaderSectionProps): ReactElement => {
  const { data: currentUser } = useUsersMe();
  const photos = consolidatePhotos(enrichedData, visitedPois, currentUser?.id);
  const { hasNoVisibleImages } = usePlaceDetailsImages();

  const hasEnrichedPhotos =
    enrichedData?.photos !== undefined && enrichedData.photos.length > 0;

  // Show loading placeholder if enriched data is loading and we don't have enriched photos yet
  const showLoadingPlaceholder =
    isLoadingEnriched && !hasEnrichedPhotos && visitedPois.length === 0;

  return (
    <Center className={`z-20 px-2 ${!hasNoVisibleImages ? "pb-4" : ""}`}>
      <Animated.View style={[imageBoxAnimatedStyle]} className="w-full">
        {!showLoadingPlaceholder && !hasNoVisibleImages && (
          <CustomImage
            sources={localImages.starStruck}
            useAppleWebpCodec={false}
            height={60}
            width={60}
            containerClassName="absolute -left-1 -top-3 z-10 rotate-[-16deg]"
            contentFit={"contain"}
            showLoader={false}
          />
        )}
        {showLoadingPlaceholder ? (
          <PhotosLoadingPlaceholder />
        ) : (
          <PhotosSection photos={photos} />
        )}
      </Animated.View>
    </Center>
  );
};
