import { Galeria } from "@nandorojo/galeria";
import type { ReactElement } from "react";
import { type ViewStyle } from "react-native";

import { type ImageLoadAsyncSource } from "@/hooks/queries/useImageFromMultipleSources";

interface SingleImageGalleryProps {
  source: ImageLoadAsyncSource | ImageLoadAsyncSource[];
  style?: ViewStyle;
  children: ReactElement;
}

const hasStringUri = (value: unknown): value is { uri: string } =>
  typeof value === "object" &&
  value !== null &&
  "uri" in value &&
  typeof (value as { uri: unknown }).uri === "string";

const extractGalleryUrl = (
  source: ImageLoadAsyncSource | ImageLoadAsyncSource[],
): string | undefined => {
  if (typeof source === "string") {
    return source;
  }
  if (Array.isArray(source)) {
    const first = source[0];
    return first !== undefined ? extractGalleryUrl(first) : undefined;
  }
  if (hasStringUri(source)) {
    return source.uri;
  }
  return undefined;
};

export const SingleImageGallery = ({
  source,
  style,
  children,
}: SingleImageGalleryProps): ReactElement => {
  const url = extractGalleryUrl(source);
  if (url === undefined) {
    return <>{children}</>;
  }
  return (
    <Galeria urls={[url]} theme="dark">
      <Galeria.Image index={0} style={style} dynamicAspectRatio>
        {children}
      </Galeria.Image>
    </Galeria>
  );
};
