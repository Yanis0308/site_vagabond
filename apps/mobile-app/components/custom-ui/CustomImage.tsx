import {
  // eslint-disable-next-line no-restricted-imports -- allowed here
  Image,
  ImageBackground,
  type ImageContentFit,
  type ImageProps,
} from "expo-image";
import { cssInterop } from "nativewind";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";

cssInterop(Image, { className: "style" });
cssInterop(View, { className: "style" });

type ImageSourceType = ImageProps["source"];

interface CustomImageProps extends Omit<ImageProps, "source" | "contentFit"> {
  source?: ImageSourceType;
  sources?: ImageSourceType[];
  height: number | "full";
  width?: number | "full";
  contentFit: ImageContentFit | "autoWithBackground";
  showLoader: boolean;
  containerClassName?: string;
}

export const CustomImage = memo(
  ({
    source,
    sources,
    height,
    width,
    showLoader,
    className,
    contentFit,
    containerClassName,
    ...props
  }: CustomImageProps) => {
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [calculatedContentFit, setCalculatedContentFit] =
      useState<ImageContentFit | null>(null);

    // Determine the list of sources to try
    const allSources = useMemo(() => {
      return sources ?? (source !== undefined ? [source] : []);
    }, [sources, source]);

    const imageStyle = {
      height: height === "full" ? "100%" : height,
      width: typeof width === "number" ? width : "100%",
    } as const;

    // Déterminer le contentFit à utiliser
    const optimalContentFit =
      contentFit === "autoWithBackground"
        ? (calculatedContentFit ?? "contain")
        : contentFit;

    // Update current source when sources or source prop changes
    useEffect(() => {
      if (allSources.length > 0) {
        setCurrentSourceIndex(0);
        setIsLoading(true); // Start loading immediately when we have a source
        // Reset le contentFit calculé quand on change de source
        if (contentFit === "autoWithBackground") {
          setCalculatedContentFit(null);
        }
      } else {
        setCurrentSourceIndex(0);
        setIsLoading(false);
        setCalculatedContentFit(null);
      }
    }, [allSources, contentFit]);

    const handleLoad = useCallback(
      (event: { source?: { width: number; height: number } }) => {
        setIsLoading(false);

        // Si mode auto, calculer le contentFit optimal directement
        if (
          contentFit === "autoWithBackground" &&
          event?.source !== undefined
        ) {
          const { width: imageWidth, height: imageHeight } = event.source;

          // Si l'image est en paysage ou carrée (largeur >= hauteur), utiliser "cover"
          // Si l'image est en portrait (hauteur > largeur), utiliser "contain"
          const newContentFit = imageWidth >= imageHeight ? "cover" : "contain";
          setCalculatedContentFit(newContentFit);
        }
      },
      [contentFit],
    );

    const handleError = useCallback(() => {
      setCurrentSourceIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= allSources.length) {
          // No more sources to try
          setIsLoading(false);
          setCalculatedContentFit(null);
        }
        return nextIndex;
      });
    }, [allSources]);

    // Only render if we have a valid source
    if (currentSourceIndex >= allSources.length) {
      return null;
    }

    return (
      <View style={imageStyle} className={cn(containerClassName)}>
        {/* Image always rendered to trigger loading events, but hidden during loading */}
        <ImageBackground
          source={allSources[currentSourceIndex]}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            className,
            "w-full h-full transition-opacity duration-300 ease-in-out",
            {
              "opacity-0": isLoading || contentFit !== "autoWithBackground",
              "opacity-100": !isLoading && contentFit === "autoWithBackground",
            },
          )}
          contentFit="cover"
          blurRadius={50}
          {...props}
        >
          <Image
            source={allSources[currentSourceIndex]}
            className={cn(
              className,
              "w-full h-full transition-opacity duration-300 ease-in-out",
              {
                "opacity-0": showLoader && isLoading,
                "opacity-100": !showLoader || !isLoading,
              },
            )}
            contentFit={optimalContentFit}
            cachePolicy="memory-disk"
            {...props}
          />
        </ImageBackground>

        {/* Loader overlay when loading - positioned to fill the container */}
        {showLoader && (
          <View
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out",
              {
                "opacity-100": isLoading,
                "opacity-0 pointer-events-none": !isLoading,
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
