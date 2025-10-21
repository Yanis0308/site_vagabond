import { BlurView } from "expo-blur";
import {
  // eslint-disable-next-line no-restricted-imports -- allowed here
  Image,
  type ImageContentFit,
  type ImageProps,
} from "expo-image";
import { cssInterop } from "nativewind";
import { memo, useMemo } from "react";
import { View } from "react-native";

import { Spinner } from "@/components/ui/spinner";
import {
  type ImageLoadAsyncSource,
  useImageFromMultipleSources,
} from "@/hooks/queries/useImageFromMultipleSources";
import { cn } from "@/utils/cn";

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
    const allSources = useMemo(() => {
      return Array.isArray(sources) ? sources : [sources];
    }, [sources]);

    const { data: imageLoaded, isLoading: isImageLoading } =
      useImageFromMultipleSources(allSources);

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
            cachePolicy="memory-disk"
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
            cachePolicy="memory-disk"
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
          cachePolicy="memory-disk"
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
