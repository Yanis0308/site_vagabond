import { Image, type ImageProps } from "expo-image"; // eslint-disable-line no-restricted-imports -- allowed here
import { cssInterop } from "nativewind";
import { memo } from "react";

cssInterop(Image, { className: "style" });

export const CustomImage = memo(({ ...props }: ImageProps) => {
  return <Image {...props} />;
});

CustomImage.displayName = "CustomImage";
