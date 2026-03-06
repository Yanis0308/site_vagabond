import { type ImageRef } from "expo-image";
import { type ReactElement, useEffect, useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { useImageFromMultipleSources } from "@/hooks/queries/useImageFromMultipleSources";

import {
  calculateMaxImageSize,
  determineOptimalContentFit,
  generateRecyclingKey,
  getImageStyle,
} from "./image.utils";
import { ImageWithBlurBackground } from "./ImageWithBlurBackground";
import { SimpleImage } from "./SimpleImage";
import { type CustomImageProps } from "./types";

/**
 * Extracts aspect ratio from a loaded ImageRef
 */
const getAspectRatioFromImageRef = (
  imageLoaded: ImageRef | number | null | undefined,
): number | undefined => {
  if (
    imageLoaded !== null &&
    typeof imageLoaded === "object" &&
    "width" in imageLoaded &&
    "height" in imageLoaded
  ) {
    const { width, height } = imageLoaded as { width: number; height: number };
    if (height > 0) {
      return width / height;
    }
  }
  return undefined;
};

/**
 * CustomImage component - Main orchestrator for image display
 * Handles image loading, optimization, and rendering with optional blur background
 */
export const CustomImage = ({
  sources,
  height,
  width,
  showLoader,
  className,
  contentFit,
  containerClassName,
  maxWidthPercentage,
  onLoadError,
  ...props
}: CustomImageProps): ReactElement => {
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = windowWidth * (maxWidthPercentage ?? 1);

  // Normalize sources to array
  const allSources = Array.isArray(sources) ? sources : [sources];

  // 1. Calculate dimensions and keys
  const recyclingKey = generateRecyclingKey(allSources);
  const maxImageSize = calculateMaxImageSize(width, height, windowWidth);

  // 2. Load image using optimized strategy
  const { data: imageLoaded, isLoading } = useImageFromMultipleSources(
    allSources,
    { maxImageSize },
  );

  useEffect(() => {
    if (!isLoading && (imageLoaded === null || imageLoaded === undefined)) {
      onLoadError?.();
    }
  }, [imageLoaded, isLoading, onLoadError]);

  // 3. Calculate aspect ratio from loaded ImageRef (no extra network call)
  const aspectRatio = useMemo(
    () =>
      contentFit === "aspectRatio"
        ? getAspectRatioFromImageRef(imageLoaded)
        : undefined,
    [contentFit, imageLoaded],
  );

  // 4. Determine optimal content fit
  const optimalContentFit = determineOptimalContentFit(contentFit, imageLoaded);

  // 5. Get image style with aspect ratio if needed
  const imageStyle = getImageStyle(
    height,
    width,
    maxWidth,
    contentFit === "aspectRatio" ? aspectRatio : undefined,
  );

  // 6. Common props for both render modes
  const commonProps = {
    source: imageLoaded,
    contentFit: optimalContentFit,
    recyclingKey,
    showLoader,
    isLoading,
    className,
    containerClassName,
    imageStyle,
    ...props,
  };

  // 7. Delegate rendering based on contentFit mode
  if (contentFit === "autoWithBackground") {
    return <ImageWithBlurBackground {...commonProps} />;
  }

  return <SimpleImage {...commonProps} />;
};
