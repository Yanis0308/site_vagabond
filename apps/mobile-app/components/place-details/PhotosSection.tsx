import { Galeria } from "@nandorojo/galeria";
import { type PoiEnrichedPhoto } from "@vagabond/shared-utils/dist/schemas/processors/llm";
import { type ReactElement, type ReactNode } from "react";
import { FlatList } from "react-native-gesture-handler";

import { usePlaceDetailsImages } from "./PlaceDetailsImagesContext";
import { PlaceImage } from "./PlaceImage";

interface PhotosSectionProps {
  photos: PoiEnrichedPhoto[];
}

const photosSorter = (a: PoiEnrichedPhoto, b: PoiEnrichedPhoto): number => {
  if (a.isPrimary) {
    return -1;
  }
  if (b.isPrimary) {
    return 1;
  }
  return 0;
};

export const PhotosSection = ({ photos }: PhotosSectionProps): ReactNode => {
  const { failedUrls } = usePlaceDetailsImages();
  const visiblePhotos = [...photos]
    .sort(photosSorter)
    .filter((photo) => !failedUrls.has(photo.url));
  const isSinglePhoto = visiblePhotos.length === 1;
  const galleryUrls = visiblePhotos.map((photo) => photo.url);

  const keyExtractor = (item: PoiEnrichedPhoto): string => item.url;
  const renderItem = ({
    item,
    index,
  }: {
    item: PoiEnrichedPhoto;
    index: number;
  }): ReactElement => (
    <PlaceImage
      index={index}
      url={item.url}
      caption={item.caption}
      isSinglePhoto={isSinglePhoto}
    />
  );

  return (
    <Galeria urls={galleryUrls} theme="dark">
      <FlatList
        data={visiblePhotos}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        contentContainerClassName="py-1 gap-2"
        showsHorizontalScrollIndicator={false}
      />
    </Galeria>
  );
};
