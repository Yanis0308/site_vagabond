import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

interface PlaceDetailsImagesContextValue {
  hasNoVisibleImages: boolean;
  reportImageLoadFailed: () => void;
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
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const failedCountRef = useRef(0);
  const prevPlaceIdRef = useRef(placeId);

  // Reset state when the place changes
  if (prevPlaceIdRef.current !== placeId) {
    prevPlaceIdRef.current = placeId;
    failedCountRef.current = 0;
    setAllImagesFailed(false);
  }

  const hasNoVisibleImages = imageCount === 0 || allImagesFailed;

  const reportImageLoadFailed = useCallback((): void => {
    failedCountRef.current += 1;
    if (imageCount > 0 && failedCountRef.current >= imageCount) {
      setAllImagesFailed(true);
    }
  }, [imageCount]);

  return {
    hasNoVisibleImages,
    reportImageLoadFailed,
  };
};

export const PlaceDetailsImagesProvider = PlaceDetailsImagesContext.Provider;
