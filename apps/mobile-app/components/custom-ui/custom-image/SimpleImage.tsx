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

interface SimpleImageProps extends Omit<ImageProps, "source" | "contentFit"> {
  source: ImageRef | number | null | undefined;
  contentFit: ImageContentFit;
  recyclingKey: string;
  showLoader: boolean;
  isLoading: boolean;
  containerClassName?: string;
  imageStyle: ImageStyleResult;
}

/**
 * Simple image component without blur background effect
 */
export const SimpleImage = ({
  source,
  contentFit,
  recyclingKey,
  showLoader,
  isLoading,
  className,
  containerClassName,
  imageStyle,
  ...props
}: SimpleImageProps): ReactElement => {
  const displayLoader = showLoader && isLoading;

  return (
    <View style={imageStyle} className={cn(containerClassName)}>
      <Image
        source={source}
        className={cn(
          className,
          "size-full transition-opacity duration-300 ease-in-out",
          {
            "opacity-0": showLoader && displayLoader,
            "opacity-100": !showLoader || !displayLoader,
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
