import type { BriefVisitedPoi } from "@vagabond/shared-utils";
import { router } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { memo, type ReactElement } from "react";
import { Pressable } from "react-native";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
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

export const ProfilePoiItem = memo(
  ({
    poi,
    allowNavigation,
    allowProfileEdit,
  }: ProfilePoiItemProps): ReactElement => {
    const { setSelectedPlace } = usePlaceSelection();
    const handleDeleteVisitedPoi = useDeleteVisitedPoiWithConfirm(poi.poiId);
    const visitDate = new Date(poi.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const handlePress = (): void => {
      if (!allowNavigation) {
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

      router.push({
        pathname: "/",
      });
    };

    return (
      <Pressable onPress={handlePress}>
        <HStack className="mx-1 mb-3 gap-0 border-b border-gray-200 bg-white">
          <CustomImage
            sources={
              resolveVisitedPoiImageUrl(poi, allowProfileEdit) ??
              localImages.noPhotoPlaceholder
            }
            height={"full"}
            width={70}
            contentFit="cover"
            showLoader={true}
          />
          <HStack className="flex-1 items-center justify-between p-2">
            <VStack className="shrink gap-1">
              {poi.name !== undefined && (
                <CustomText className="font-semibold text-gray-900">
                  {poi.name}
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
        </HStack>
      </Pressable>
    );
  },
);

ProfilePoiItem.displayName = "ProfilePoiItem";
