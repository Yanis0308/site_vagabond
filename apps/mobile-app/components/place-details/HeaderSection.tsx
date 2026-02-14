import { type PoiEnrichedPhoto } from "@vagabond/shared-utils/dist/schemas/processors/llm";
import { type ReactElement } from "react";
import Animated from "react-native-reanimated";

import { Center } from "@/components/ui/center";
import { config } from "@/constants/Config";
import { type PoiEnrichedType } from "@/http/pois";
import { type VisitedPoiType } from "@/http/visited-pois";
import { localImages } from "@/utils/localImages";

import { CustomImage } from "../custom-ui/CustomImage";
import { PhotosLoadingPlaceholder } from "./PhotosLoadingPlaceholder";
import { PhotosSection } from "./PhotosSection";

interface HeaderSectionProps {
  enrichedData: PoiEnrichedType | undefined;
  visitedPois: VisitedPoiType[];
  isLoadingEnriched: boolean;
  imageBoxAnimatedStyle: {
    opacity: number;
    transform: Array<{ translateY: number }>;
    marginTop: number;
  };
}

export function HeaderSection({
  enrichedData,
  visitedPois,
  isLoadingEnriched,
  imageBoxAnimatedStyle,
}: HeaderSectionProps): ReactElement {
  const photos: PoiEnrichedPhoto[] = [];
  const hasEnrichedPhotos =
    enrichedData?.photos !== undefined && enrichedData.photos.length > 0;

  if (hasEnrichedPhotos && enrichedData.photos !== undefined) {
    photos.push(...enrichedData.photos);
  }
  if (photos.length === 0 && visitedPois.length > 0) {
    visitedPois.forEach((visitedPoi, index) => {
      const photo: PoiEnrichedPhoto = {
        url: `${config.cdnUrl}/${visitedPoi.imageKey}`,
        caption: visitedPoi.comment ?? "",
        credit: "",
        isPrimary: index === 0,
      };
      photos.push(photo);
    });
  }

  // Show loading placeholder if enriched data is loading and we don't have enriched photos yet
  const showLoadingPlaceholder =
    isLoadingEnriched && !hasEnrichedPhotos && visitedPois.length === 0;

  return (
    <Center className={"z-20 px-2"}>
      <Animated.View style={[imageBoxAnimatedStyle]} className="w-full">
        {!showLoadingPlaceholder && (
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
}
