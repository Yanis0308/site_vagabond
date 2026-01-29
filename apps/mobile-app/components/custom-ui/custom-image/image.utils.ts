import { type ImageContentFit, type ImageRef } from "expo-image";
import { type DimensionValue } from "react-native";

import { type ImageLoadAsyncSource } from "@/hooks/queries/useImageFromMultipleSources";

import { type ImageStyleResult } from "./types";

/**
 * Generate a unique recycling key from image sources for caching
 */
export const generateRecyclingKey = (
  sources: ImageLoadAsyncSource[],
): string => {
  if (sources.length === 0) {
    return "default-key";
  }
  return sources
    .map((src) => {
      if (typeof src === "string") {
        return src;
      }
      if (typeof src === "object") {
        return JSON.stringify(src);
      }
      return String(src);
    })
    .join("-");
};

/**
 * Calculate optimal image size for loading based on dimensions
 */
export const calculateMaxImageSize = (
  width: number | "full" | undefined,
  height: number | "full",
  windowWidth: number,
): number => {
  if (typeof width === "number") {
    return Math.ceil(width * 2); // 2x for retina
  } else if (typeof height === "number") {
    // If height is specified as a number, estimate width based on common aspect ratios
    // Assume common aspect ratios (16:9, 4:3, 1:1)
    // Use the larger dimension * 2 for retina
    return Math.ceil(height * 2);
  } else {
    // Default to window width
    return windowWidth;
  }
};

/**
 * Determine optimal content fit mode based on image data
 */
export const determineOptimalContentFit = (
  contentFit: ImageContentFit | "autoWithBackground" | "aspectRatio",
  imageLoaded: ImageRef | number | null | undefined,
): ImageContentFit => {
  if (contentFit === "aspectRatio") {
    return "cover";
  }

  if (contentFit !== "autoWithBackground") {
    return contentFit;
  }

  // For autoWithBackground, fallback to cover if no image data
  if (imageLoaded === null || imageLoaded === undefined) {
    return "cover";
  } else if (
    typeof imageLoaded === "number" ||
    imageLoaded.width >= imageLoaded.height
  ) {
    return "cover";
  } else {
    return "contain";
  }
};

/**
 * Get container style based on dimensions and optional aspect ratio
 */
export const getImageStyle = (
  height: number | "full",
  width?: number | "full",
  maxWidth?: number,
  aspectRatio?: number,
): ImageStyleResult => {
  const heightValue: DimensionValue = height === "full" ? "100%" : height;
  const widthValue: DimensionValue | undefined =
    aspectRatio !== undefined
      ? undefined
      : typeof width === "number"
        ? width
        : "100%";

  const style: ImageStyleResult = {
    height: heightValue,
    maxWidth: maxWidth,
  };

  // If aspectRatio is provided, let React Native calculate width automatically
  // Otherwise, use the provided width or default to 100%
  if (aspectRatio !== undefined) {
    style.aspectRatio = aspectRatio;
    // Don't set width when aspectRatio is present - it will be calculated automatically
  } else if (widthValue !== undefined) {
    style.width = widthValue;
  }

  return style;
};
