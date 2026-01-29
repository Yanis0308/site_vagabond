import { BlurView } from "expo-blur";
import {
  // eslint-disable-next-line no-restricted-imports -- allowed here
  Image,
  type ImageContentFit,
  type ImageProps,
  type ImageRef,
} from "expo-image";
import { cssInterop } from "nativewind";
import { type ReactElement } from "react";
import { View } from "react-native";

import { cn } from "@/utils/cn";

import { ImageLoader } from "./ImageLoader";
import { type ImageStyleResult } from "./types";

cssInterop(Image, { className: "style" });
cssInterop(View, { className: "style" });

interface ImageWithBlurBackgroundProps extends Omit<
  ImageProps,
  "source" | "contentFit"
> {
  source: ImageRef | number | null | undefined;
  contentFit: ImageContentFit;
  recyclingKey: string;
  showLoader: boolean;
  isLoading: boolean;
  containerClassName?: string;
  imageStyle: ImageStyleResult;
}

/**
 * Image component with blur background effect for portrait images
 */
export const ImageWithBlurBackground = ({
  source,
  contentFit,
  recyclingKey,
  showLoader,
  isLoading,
  className,
  containerClassName,
  imageStyle,
  ...props
}: ImageWithBlurBackgroundProps): ReactElement => {
  const displayLoader = showLoader && isLoading;

  return (
    <View
      style={imageStyle}
      className={cn(containerClassName, "overflow-hidden")}
    >
      {/* Background image without blur */}
      <Image
        source={source}
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
        source={source}
        className={cn(
          className,
          "size-full transition-opacity duration-300 ease-in-out",
          {
            "opacity-0": displayLoader,
            "opacity-100": !displayLoader,
          },
        )}
        contentFit={contentFit}
        cachePolicy={"disk"}
        recyclingKey={recyclingKey}
        {...props}
      />

      <ImageLoader showLoader={showLoader} isLoading={isLoading} />
    </View>
  );
};
