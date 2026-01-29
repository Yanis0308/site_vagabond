import { type PoiEnrichedPhoto } from "@vagabond/shared-utils/dist/schemas/processors/llm";
import { type ReactElement } from "react";

import { shadowStyles } from "@/styles/shadows";

import { CustomImage } from "../custom-ui/CustomImage";
import { Box } from "../ui/box";

const DEFAULT_IMAGE_HEIGHT = 236;

interface PlaceImageProps extends PoiEnrichedPhoto {
  isSinglePhoto?: boolean;
}

export const PlaceImage = ({
  url,
  caption,
  isSinglePhoto = false,
}: PlaceImageProps): ReactElement => {
  const imageSources: string[] = [url];

  return (
    <Box
      style={[shadowStyles.ratingBlock]}
      className="rotate-2 rounded-2xl bg-background-50 p-1.5"
    >
      <CustomImage
        sources={imageSources}
        alt={caption ?? ""}
        height={DEFAULT_IMAGE_HEIGHT}
        maxWidthPercentage={isSinglePhoto ? undefined : 0.8}
        className={"rounded-2xl"}
        contentFit={"aspectRatio"}
        priority={"high"}
        showLoader={true}
      />
    </Box>
  );
};
