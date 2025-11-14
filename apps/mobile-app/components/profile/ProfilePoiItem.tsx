import { memo, type ReactElement } from "react";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { config } from "@/constants/Config";
import type { BriefVisitedPoiType } from "@/utils/types";

interface ProfilePoiItemProps {
  poi: BriefVisitedPoiType;
}

export const ProfilePoiItem = memo(
  ({ poi }: ProfilePoiItemProps): ReactElement => {
    const visitDate = new Date(poi.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return (
      <HStack className=" mx-2 mb-3 gap-0 border-b border-gray-200 bg-white">
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
          <CustomText className="text-sm text-gray-600">{visitDate}</CustomText>
        </VStack>
      </HStack>
    );
  },
);

ProfilePoiItem.displayName = "ProfilePoiItem";
