import { Galeria } from "@nandorojo/galeria";
import { type PoiEnrichedPhoto } from "@vagabond/shared-utils/dist/schemas/processors/llm";
import { type ReactElement } from "react";

import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";

import { CustomImage } from "../custom-ui/CustomImage";
import { Box } from "../ui/box";
import { usePlaceDetailsImages } from "./PlaceDetailsImagesContext";

const DEFAULT_IMAGE_HEIGHT = 236;

interface PlaceImageProps extends PoiEnrichedPhoto {
  index: number;
  isSinglePhoto?: boolean;
}

export const PlaceImage = ({
  index,
  url,
  caption,
  isSinglePhoto = false,
}: PlaceImageProps): ReactElement => {
  const { reportImageLoadFailed } = usePlaceDetailsImages();

  const handleLoadError = (): void => {
    reportImageLoadFailed(url);
  };

  return (
    <Box
      style={[shadowStyles.ratingBlock]}
      className={cn("rotate-2 rounded-2xl bg-background-50 p-1.5")}
    >
      <Galeria.Image
        index={index}
        style={{
          height: DEFAULT_IMAGE_HEIGHT,
        }}
        dynamicAspectRatio
      >
        <CustomImage
          sources={[url]}
          alt={caption ?? ""}
          height={DEFAULT_IMAGE_HEIGHT}
          maxWidthPercentage={isSinglePhoto ? undefined : 0.8}
          className={"rounded-2xl"}
          contentFit={"aspectRatio"}
          priority={"high"}
          showLoader={true}
          onLoadError={handleLoadError}
        />
      </Galeria.Image>
    </Box>
  );
};
