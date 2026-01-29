import { type PoiEnrichedPhoto } from "@vagabond/shared-utils/dist/schemas/processors/llm";
import { type ReactElement, type ReactNode } from "react";
import { FlatList } from "react-native-gesture-handler";

import { PlaceImage } from "./PlaceImage";

interface PhotosSectionProps {
  photos: PoiEnrichedPhoto[];
}

export const PhotosSection = ({ photos }: PhotosSectionProps): ReactNode => {
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.isPrimary) {
      return -1;
    }
    if (b.isPrimary) {
      return 1;
    }
    return 0;
  });

  const isSinglePhoto = sortedPhotos.length === 1;

  const keyExtractor = (item: PoiEnrichedPhoto): string => item.url;
  const renderItem = ({
    item,
  }: {
    item: PoiEnrichedPhoto;
  }): ReactElement | null => (
    <PlaceImage
      url={item.url}
      caption={item.caption}
      isSinglePhoto={isSinglePhoto}
    />
  );

  // We use FlatList from react-native-gesture-handler because we are inside a BottomSheet
  // and nested FlashList is not working properly in this case
  return (
    <FlatList
      data={sortedPhotos}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      horizontal
      contentContainerClassName="py-1 gap-2"
      showsHorizontalScrollIndicator={false}
    />
  );
};
