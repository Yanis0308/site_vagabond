import type { BriefVisitedPoi } from "@vagabond/shared-utils";
import { getUserDisplayName } from "@vagabond/shared-utils";
import { type FC, memo } from "react";

import { CustomImage } from "@/components/custom-ui/CustomImage";
import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { config } from "@/constants/Config";
import { useUsersMe } from "@/hooks/queries/useUsersMe";

interface ValidatedPlaceCardProps {
  visitedPoi: BriefVisitedPoi;
}

export const ValidatedPlaceCard: FC<ValidatedPlaceCardProps> = memo(
  ({ visitedPoi }) => {
    const { data: currentUser } = useUsersMe();
    const username = getUserDisplayName(
      currentUser?.fullName,
      currentUser?.email,
    );

    return (
      <Box className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <HStack className="gap-4">
          {/* Image */}
          <CustomImage
            sources={`${config.cdnUrl}/${visitedPoi.imageKey}`}
            height={80}
            width={80}
            className="rounded-lg"
            contentFit="cover"
            showLoader={true}
          />

          {/* Informations */}
          <VStack className="flex-1 gap-1">
            {visitedPoi.name !== undefined && (
              <CustomText className="text-lg font-bold text-gray-900">
                {visitedPoi.name}
              </CustomText>
            )}

            <HStack className="items-center gap-2">
              <CustomText className="font-semibold">{username}</CustomText>
              <CustomText className="text-yellow-500">
                {"⭐".repeat(visitedPoi.rating)}
              </CustomText>
            </HStack>

            <CustomText className="text-sm text-gray-600">
              {new Date(visitedPoi.createdAt).toLocaleDateString("fr-FR")}
            </CustomText>

            {visitedPoi.comment !== null && (
              <CustomText className="mt-1 text-gray-800">
                {visitedPoi.comment}
              </CustomText>
            )}
          </VStack>
        </HStack>
      </Box>
    );
  },
);

ValidatedPlaceCard.displayName = "ValidatedPlaceCard";
