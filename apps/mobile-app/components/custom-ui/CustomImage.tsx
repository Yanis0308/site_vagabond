import { Image } from "expo-image";
import { ImageProps } from "expo-image/src/Image.types";
import { cssInterop } from "nativewind";
import { memo, useMemo } from "react";

import { replaceLocalhost } from "@/utils/image";

cssInterop(Image, { className: "style" });

export const CustomImage = memo(({ source, ...props }: ImageProps) => {
  const sourceModified = useMemo(() => {
    if (typeof source === "string") {
      return replaceLocalhost(source);
    } else {
      return source;
    }
  }, [source]);
  return <Image source={sourceModified} {...props} />;
});

CustomImage.displayName = "CustomImage";
