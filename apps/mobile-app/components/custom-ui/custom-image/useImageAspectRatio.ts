import { useEffect, useState } from "react";
//eslint-disable-next-line no-restricted-imports -- we need to use the react-native Image component
import { Image } from "react-native";

import { logger } from "@/utils/logger";

/**
 * Hook to calculate aspect ratio of an image from its URL
 */
export const useImageAspectRatio = (
  imageUrl: string | undefined | null,
): number | undefined => {
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (imageUrl === undefined || typeof imageUrl !== "string") {
      return;
    }

    Image.getSize(
      imageUrl,
      (width, height) => {
        setAspectRatio(width / height);
      },
      (error) => {
        logger("Failed to get image size:", error);
        setAspectRatio(undefined);
      },
    );
  }, [imageUrl]);

  return aspectRatio;
};
