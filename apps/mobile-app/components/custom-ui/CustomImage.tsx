import { BlurView } from "expo-blur";
import {
  // eslint-disable-next-line no-restricted-imports -- allowed here
  Image,
  type ImageContentFit,
  type ImageProps,
  useImage,
} from "expo-image";
import { cssInterop } from "nativewind";
import { memo, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";

import { Spinner } from "@/components/ui/spinner";
import {
  type ImageLoadAsyncSource,
  useImageFromMultipleSources,
} from "@/hooks/queries/useImageFromMultipleSources";
import { cn } from "@/utils/cn";
import { logger } from "@/utils/logger";

cssInterop(Image, { className: "style" });
cssInterop(View, { className: "style" });

interface CustomImageProps extends Omit<ImageProps, "source" | "contentFit"> {
  sources: ImageLoadAsyncSource | ImageLoadAsyncSource[];
  height: number | "full";
  width?: number | "full";
  contentFit: ImageContentFit | "autoWithBackground";
  showLoader: boolean;
  containerClassName?: string;
}

export const CustomImage = memo(
  ({
    sources,
    height,
    width,
    showLoader,
    className,
    contentFit,
    containerClassName,
    ...props
  }: CustomImageProps) => {
    const { width: windowWidth } = useWindowDimensions();

    const allSources = useMemo(() => {
      return Array.isArray(sources) ? sources : [sources];
    }, [sources]);

    // Generate recyclingKey automatically from sources
    const recyclingKey = useMemo(() => {
      return allSources
        .map((src) => {
          if (typeof src === "string") {
            return src;
          }
          if (typeof src === "object" && src !== null) {
            return JSON.stringify(src);
          }
          return String(src);
        })
        .join("-");
    }, [allSources]);

    // Calculate maxImageSize automatically based on image dimensions
    const maxImageSize = useMemo(() => {
      // If width is specified as a number, use it with a multiplier for retina displays
      if (typeof width === "number") {
        return Math.ceil(width * 2); // 2x for retina
      }
      // If height is specified as a number, estimate width based on common aspect ratios
      if (typeof height === "number") {
        // Assume common aspect ratios (16:9, 4:3, 1:1)
        // Use the larger dimension * 2 for retina
        return Math.ceil(height * 2);
      }
      // Default to window width
      return windowWidth;
    }, [width, height, windowWidth]);

    const maxWidth = maxImageSize;

    // Try to use useImage hook for string sources (first string source found)
    const firstStringSource = useMemo(() => {
      return allSources.find((source) => typeof source === "string");
    }, [allSources]);

    const useImageOptions = useMemo(
      () => ({
        maxWidth,
        onError: (error: Error): void => {
          logger("Loading failed:", firstStringSource, error.message);
        },
      }),
      [maxWidth, firstStringSource],
    );

    const optimizedImageSource = useImage(
      typeof firstStringSource === "string" ? firstStringSource : "",
      useImageOptions,
    );

    // Fallback to useImageFromMultipleSources for non-string sources or if useImage didn't work
    const useImageFromMultipleSourcesOptions = useMemo(
      () => ({
        maxImageSize,
      }),
      [maxImageSize],
    );

    const { data: fallbackImageLoaded, isLoading: isImageLoading } =
      useImageFromMultipleSources(
        allSources,
        useImageFromMultipleSourcesOptions,
      );

    // Use optimized source if available, otherwise use fallback
    const imageLoaded = useMemo(() => {
      if (
        optimizedImageSource !== null &&
        optimizedImageSource !== undefined &&
        typeof firstStringSource === "string" &&
        firstStringSource !== ""
      ) {
        return optimizedImageSource;
      }
      return fallbackImageLoaded;
    }, [optimizedImageSource, fallbackImageLoaded, firstStringSource]);

    const optimalContentFit = useMemo<ImageContentFit>(() => {
      if (contentFit !== "autoWithBackground") {
        return contentFit;
      }

      // For autoWithBackground, fallback to cover if no image data
      if (imageLoaded === null || imageLoaded === undefined) {
        return "cover";
      }

      if (
        typeof imageLoaded === "number" ||
        imageLoaded.width >= imageLoaded.height
      ) {
        return "cover";
      }
      return "contain";
    }, [contentFit, imageLoaded]);

    const imageStyle = {
      height: height === "full" ? "100%" : height,
      width: typeof width === "number" ? width : "100%",
    } as const;

    const displayLoader = useMemo(() => {
      return showLoader && isImageLoading;
    }, [showLoader, isImageLoading]);

    // Render with background blur only for autoWithBackground mode
    if (contentFit === "autoWithBackground") {
      return (
        <View
          style={imageStyle}
          className={cn(containerClassName, "overflow-hidden")}
        >
          {/* Background image without blur */}
          <Image
            source={imageLoaded}
            className={cn(
              "absolute inset-0 size-full transition-opacity duration-300 ease-in-out rounded-lg",
              {
                "opacity-0": displayLoader,
                "opacity-100": !displayLoader,
              },
            )}
            contentFit="cover"
            cachePolicy={"disk"}
            recyclingKey={recyclingKey}
            {...props}
          />

          {/* BlurView overlay for blur effect */}
          <BlurView
            intensity={80}
            tint="default"
            className="absolute inset-0 size-full"
            style={{ overflow: "hidden" }}
            experimentalBlurMethod="dimezisBlurView"
          />

          {/* Main image on top */}
          <Image
            source={imageLoaded}
            className={cn(
              className,
              "size-full transition-opacity duration-300 ease-in-out",
              {
                "opacity-0": displayLoader,
                "opacity-100": !displayLoader,
              },
            )}
            contentFit={optimalContentFit}
            cachePolicy={"disk"}
            recyclingKey={recyclingKey}
            {...props}
          />

          {/* Loader overlay when loading */}
          {showLoader && (
            <View
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out",
                {
                  "opacity-100": displayLoader,
                  "opacity-0 pointer-events-none": !displayLoader,
                },
              )}
            >
              <Spinner size="large" className="text-gray-600" />
            </View>
          )}
        </View>
      );
    }

    // Simple render for cover and contain modes
    return (
      <View style={imageStyle} className={cn(containerClassName)}>
        <Image
          source={imageLoaded}
          className={cn(
            className,
            "size-full transition-opacity duration-300 ease-in-out",
            {
              "opacity-0": showLoader && displayLoader,
              "opacity-100": !showLoader || !displayLoader,
            },
          )}
          contentFit={optimalContentFit}
          cachePolicy={"disk"}
          recyclingKey={recyclingKey}
          {...props}
        />

        {/* Loader overlay when loading */}
        {showLoader && (
          <View
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out",
              {
                "opacity-100": displayLoader,
                "opacity-0 pointer-events-none": !displayLoader,
              },
            )}
          >
            <Spinner size="large" className="text-gray-600" />
          </View>
        )}
      </View>
    );
  },
);

CustomImage.displayName = "CustomImage";
