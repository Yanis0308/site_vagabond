import { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { VStack } from "@/components/ui/vstack";

interface ProfileOverallProgressProps {
  percentage: number;
  visited: number;
  total: number;
}

export const ProfileOverallProgress = memo(
  ({
    percentage,
    visited,
    total,
  }: ProfileOverallProgressProps): ReactElement => {
    const { t } = useTranslation("common");

    return (
      <Box className="rounded-lg border-2 border-primary-200 bg-primary-50 p-5 shadow-sm">
        <VStack className="gap-3">
          <HStack className="items-center justify-between">
            <CustomText className="text-xl font-bold text-gray-900">
              {t("overall_progress")}
            </CustomText>
            <Box className="rounded-full bg-primary-500 px-4 py-1">
              <CustomText className="text-lg font-bold text-white">
                {percentage}%
              </CustomText>
            </Box>
          </HStack>
          <Box className="relative">
            <Progress
              size="lg"
              className="w-full bg-gray-200"
              value={percentage}
            >
              <ProgressFilledTrack className="bg-primary-500" />
            </Progress>
          </Box>
          <CustomText className="text-center text-base font-medium text-gray-700">
            {t("regions_visited_progress", {
              visited,
              total,
            })}
          </CustomText>
        </VStack>
      </Box>
    );
  },
);

ProfileOverallProgress.displayName = "ProfileOverallProgress";
