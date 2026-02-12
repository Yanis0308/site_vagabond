import { router } from "expo-router";
import { memo, type ReactElement } from "react";
import { Pressable } from "react-native";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { config } from "@/constants/Config";
import { usePlaceSelection } from "@/hooks/other/usePlaceSelection";
import { mapService } from "@/services/MapService";
import type { BriefVisitedPoiType, PoiType } from "@/utils/types";

interface ProfilePoiItemProps {
  poi: BriefVisitedPoiType;
}

export const ProfilePoiItem = memo(
  ({ poi }: ProfilePoiItemProps): ReactElement => {
    const { setSelectedPlace } = usePlaceSelection();
    const visitDate = new Date(poi.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const handlePress = (): void => {
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
            sources={`${config.cdnUrl}/${poi.imageKey}`}
            height={"full"}
            width={70}
            contentFit="cover"
            showLoader={true}
          />
          <VStack className="flex-1 gap-1 p-2">
            {poi.name !== undefined && (
              <CustomText className="font-semibold text-gray-900">
                {poi.name}
              </CustomText>
            )}
            <CustomText className="text-sm text-gray-600">
              {visitDate}
            </CustomText>
          </VStack>
        </HStack>
      </Pressable>
    );
  },
);

ProfilePoiItem.displayName = "ProfilePoiItem";
