import { type ReactElement } from "react";
import { useWindowDimensions } from "react-native";

import {
  calculateMaxImageSize,
  determineOptimalContentFit,
  generateRecyclingKey,
  getImageStyle,
} from "./image.utils";
import { ImageWithBlurBackground } from "./ImageWithBlurBackground";
import { SimpleImage } from "./SimpleImage";
import { type CustomImageProps } from "./types";
import { useImageAspectRatio } from "./useImageAspectRatio";
import { useOptimizedImageSource } from "./useOptimizedImageSource";

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
  const { imageLoaded, isLoading } = useOptimizedImageSource({
    sources: allSources,
    maxWidth: maxImageSize,
  });

  // 3. Calculate aspect ratio if contentFit is "aspectRatio"
  const firstSource = allSources[0];
  const imageUrl = typeof firstSource === "string" ? firstSource : null;
  const aspectRatio = useImageAspectRatio(
    contentFit === "aspectRatio" ? imageUrl : null,
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
