import { memo, useMemo } from "react";

import { config } from "@/constants/Config";
import { localImages } from "@/utils/localImages";
import { type PoiType } from "@/utils/types";

import { CustomImage } from "../custom-ui/CustomImage";
import { logger } from "@/utils/logger";

export const PlaceImage = memo(({ place }: { place: PoiType }) => {
  // Prepare image sources in priority order: wikidata -> first visited poi -> placeholder
  const imageSources = useMemo(() => {
    const sources: (string | number)[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe
    if (place?.data[0]?.rawInfo?.wikidata !== undefined) {
      sources.push(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe
        `https://hub.toolforge.org/${place.data[0]?.rawInfo?.wikidata}?property=image&width=1000`,
      );
    }

    const lastVisitedPoiImageKey =
      place?.visitedPois[place.visitedPois.length - 1]?.imageKey;

    if (lastVisitedPoiImageKey !== undefined) {
      sources.push(`${config.cdnUrl}/${lastVisitedPoiImageKey}`);
    }

    sources.push(localImages.noPhotoPlaceholder);

    return sources;
  }, [place?.data, place?.visitedPois]);

  logger("imageSources", JSON.stringify(imageSources, null, 2));

  return (
    <CustomImage
      sources={imageSources}
      alt="Place photo illustration"
      height={236}
      className={"rounded-lg"}
      contentFit={"autoWithBackground"}
      priority={"high"}
      showLoader={true}
    />
  );
});

PlaceImage.displayName = "PlaceImage";
