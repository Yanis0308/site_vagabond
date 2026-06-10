import type { BriefVisitedPoi } from "@vagabond/shared-utils";
import { router } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, type ViewStyle } from "react-native";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { SingleImageGallery } from "@/components/custom-ui/SingleImageGallery";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useDeleteVisitedPoiWithConfirm } from "@/hooks/mutations/useDeleteVisitedPoiWithConfirm";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { mapService } from "@/services/MapService";
import { resolveVisitedPoiImageUrl } from "@/services/photoStorage";
import { localImages } from "@/utils/localImages";
import type { PoiType } from "@/utils/types";

interface ProfilePoiItemProps {
  poi: BriefVisitedPoi;
  allowNavigation: boolean;
  allowProfileEdit: boolean;
}

const THUMBNAIL_SIZE = 70;

// Thumbnail carrée. La rangée n'a pas de hauteur fixée — sans dimension
// explicite l'image rendrait à son ratio natif et dépasserait la row.
const galleryImageStyle: ViewStyle = {
  width: THUMBNAIL_SIZE,
  height: THUMBNAIL_SIZE,
};

export const ProfilePoiItem = memo(
  ({
    poi,
    allowNavigation,
    allowProfileEdit,
  }: ProfilePoiItemProps): ReactElement => {
    const { t } = useTranslation("common");
    const { setSelectedPlace } = usePlaceSelection();
    const handleDeleteVisitedPoi = useDeleteVisitedPoiWithConfirm(poi.poiId);
    const visitDate = new Date(poi.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const handlePress = (): void => {
      if (!allowNavigation || poi.isDisabled) {
        return;
      }
      const poiData: PoiType = {
        id: poi.poiId,
        name: poi.name ?? "",
        filterLevel: "UNKNOWN",
        coords: poi.coords,
      };

      setSelectedPlace(poiData);
      mapService.setPendingMove(poiData.coords, true);

      router.navigate({
        pathname: "/",
      });
    };

    const resolvedUrl = resolveVisitedPoiImageUrl(poi, allowProfileEdit);
    const imageSources = resolvedUrl ?? localImages.noPhotoPlaceholder;

    const imageElement: ReactElement = (
      <CustomImage
        sources={imageSources}
        height={THUMBNAIL_SIZE}
        width={THUMBNAIL_SIZE}
        contentFit="cover"
        showLoader={true}
      />
    );

    return (
      <HStack className="mx-1 mb-3 gap-0 border-b border-gray-200 bg-white">
        {typeof imageSources === "string" ? (
          <SingleImageGallery source={imageSources} style={galleryImageStyle}>
            {imageElement}
          </SingleImageGallery>
        ) : (
          <Pressable onPress={handlePress}>{imageElement}</Pressable>
        )}
        <Pressable onPress={handlePress} className="flex-1">
          <HStack className="items-center justify-between p-2">
            <VStack className="shrink gap-1">
              {poi.name !== undefined && (
                <CustomText className="font-semibold text-gray-900">
                  {poi.name}
                </CustomText>
              )}
              {poi.isDisabled && (
                <CustomText className="text-sm font-medium text-gray-400">
                  {t("deleted_place")}
                </CustomText>
              )}
              <CustomText className="text-sm text-gray-600">
                {visitDate}
              </CustomText>
            </VStack>
            {allowProfileEdit && (
              <Pressable
                onPress={() => {
                  handleDeleteVisitedPoi(poi.id);
                }}
                className="ml-2 rounded-full bg-tertiary-100/40 p-1"
                hitSlop={8}
              >
                <Trash2 size={14} color={themeColors.warning["600"].hex} />
              </Pressable>
            )}
          </HStack>
        </Pressable>
      </HStack>
    );
  },
);

ProfilePoiItem.displayName = "ProfilePoiItem";
