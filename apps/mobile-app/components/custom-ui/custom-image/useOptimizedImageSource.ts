import { type ImageRef, useImage } from "expo-image";

import {
  type ImageLoadAsyncSource,
  useImageFromMultipleSources,
} from "@/hooks/queries/useImageFromMultipleSources";
import { logger } from "@/utils/logger";

interface UseOptimizedImageSourceProps {
  sources: ImageLoadAsyncSource[];
  maxWidth: number;
}

interface UseOptimizedImageSourceResult {
  imageLoaded: ImageRef | number | null | undefined;
  isLoading: boolean;
}

/**
 * Hook that optimizes image loading by using useImage for string sources
 * and falling back to useImageFromMultipleSources for other source types
 */
export const useOptimizedImageSource = ({
  sources,
  maxWidth,
}: UseOptimizedImageSourceProps): UseOptimizedImageSourceResult => {
  // Try to use useImage hook for string sources (first string source found)
  const firstStringSource = sources.find(
    (source) => typeof source === "string",
  );

  const useImageOptions = {
    maxWidth,
    onError: (error: Error): void => {
      logger("Loading failed:", firstStringSource, error.message);
    },
  };

  const optimizedImageSource = useImage(
    typeof firstStringSource === "string" ? firstStringSource : "",
    useImageOptions,
  );

  // Fallback to useImageFromMultipleSources for non-string sources or if useImage didn't work
  const useImageFromMultipleSourcesOptions = {
    maxImageSize: maxWidth,
  };

  const { data: fallbackImageLoaded, isLoading: isImageLoading } =
    useImageFromMultipleSources(sources, useImageFromMultipleSourcesOptions);

  // Use optimized source if available, otherwise use fallback
  let imageLoaded: ImageRef | number | null | undefined;
  let isLoading: boolean;

  const isUsingOptimizedSource =
    optimizedImageSource !== null &&
    typeof firstStringSource === "string" &&
    firstStringSource !== "";

  if (isUsingOptimizedSource) {
    imageLoaded = optimizedImageSource;
    // When using optimized source, we're not loading since optimizedImageSource is already loaded (not null)
    isLoading = false;
  } else {
    imageLoaded = fallbackImageLoaded;
    // When using fallback, use the loading state from useImageFromMultipleSources
    isLoading = isImageLoading;
  }

  return {
    imageLoaded,
    isLoading,
  };
};
