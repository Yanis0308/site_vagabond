import { type ImageContentFit, type ImageProps } from "expo-image";
import { type DimensionValue, type ViewStyle } from "react-native";

import { type ImageLoadAsyncSource } from "@/hooks/queries/useImageFromMultipleSources";

export interface CustomImageProps extends Omit<
  ImageProps,
  "source" | "contentFit" | "recyclingKey"
> {
  sources: ImageLoadAsyncSource | ImageLoadAsyncSource[];
  height: number | "full";
  width?: number | "full";
  contentFit: ImageContentFit | "autoWithBackground" | "aspectRatio";
  showLoader: boolean;
  containerClassName?: string;
  maxWidthPercentage?: number;
  onLoadError?: () => void;
}

export interface ImageStyleResult extends Pick<
  ViewStyle,
  "height" | "width" | "maxWidth" | "aspectRatio"
> {
  height: DimensionValue;
  width?: DimensionValue;
  maxWidth?: DimensionValue;
  aspectRatio?: number;
}
