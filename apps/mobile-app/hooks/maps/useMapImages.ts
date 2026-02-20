import { type ImageEntry } from "@rnmapbox/maps";
import { useMemo } from "react";

import { localImages } from "@/utils/localImages";

export const useMapImages = (): Record<string, ImageEntry> => {
  return useMemo<Record<string, ImageEntry>>(
    () => ({
      bearingImage: localImages.bearingImage,
    }),
    [],
  );
};
