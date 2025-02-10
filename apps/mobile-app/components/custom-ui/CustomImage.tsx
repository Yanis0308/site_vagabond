import { Image, type ImageProps, type ImageSource } from "expo-image";
import { cssInterop } from "nativewind";
import { memo, useMemo } from "react";

import { replaceLocalhost } from "@/utils/image";

cssInterop(Image, { className: "style" });

export const CustomImage = memo(({ source, ...props }: ImageProps) => {
  const sourceModified = useMemo((): ImageSource => {
    if (typeof source === "string") {
      return { uri: replaceLocalhost(source) };
    } else {
      return source as ImageSource;
    }
  }, [source]);
  return <Image source={sourceModified} {...props} />;
});

CustomImage.displayName = "CustomImage";
