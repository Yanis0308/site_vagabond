import { createContext, useContext, useState } from "react";

interface PlaceDetailsImagesContextValue {
  hasNoVisibleImages: boolean;
  failedUrls: ReadonlySet<string>;
  reportImageLoadFailed: (url: string) => void;
}

const PlaceDetailsImagesContext =
  createContext<PlaceDetailsImagesContextValue | null>(null);

export const usePlaceDetailsImages = (): PlaceDetailsImagesContextValue => {
  const context = useContext(PlaceDetailsImagesContext);
  if (context === null) {
    throw new Error(
      "usePlaceDetailsImages must be used within a PlaceDetailsImagesProvider",
    );
  }
  return context;
};

export const usePlaceDetailsImagesContext = (
  placeId: string,
  imageCount: number,
): PlaceDetailsImagesContextValue => {
  const [currentPlaceId, setCurrentPlaceId] = useState(placeId);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  if (currentPlaceId !== placeId) {
    setCurrentPlaceId(placeId);
    setFailedUrls(new Set());
  }

  const hasNoVisibleImages = imageCount === 0 || failedUrls.size >= imageCount;

  const reportImageLoadFailed = (url: string): void => {
    setFailedUrls((prev) => {
      if (prev.has(url)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  return {
    hasNoVisibleImages,
    failedUrls,
    reportImageLoadFailed,
  };
};

export const PlaceDetailsImagesProvider = PlaceDetailsImagesContext.Provider;
