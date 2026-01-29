import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { type PoiEnrichedType } from "@/http/pois";
import { cn } from "@/utils/cn";

interface AverageVisitDurationSectionProps {
  averageVisitDuration?: PoiEnrichedType["averageVisitDuration"];
  className?: string;
}

export const AverageVisitDurationSection = memo(
  ({
    averageVisitDuration,
    className,
  }: AverageVisitDurationSectionProps): ReactNode => {
    if (averageVisitDuration?.durationInMinutes === undefined) {
      return null;
    }

    const minutes = averageVisitDuration.durationInMinutes;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const durationText =
      hours > 0
        ? `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ""}`
        : `${minutes}min`;

    return (
      <Box className={cn("gap-2", className)}>
        <Box className="flex-row items-center gap-3 rounded-2xl border border-background-300 bg-background-50 p-4">
          <CustomText type="ratingText" className="text-lg">
            {"⏱️"}
          </CustomText>
          <Box className="flex-1">
            <CustomText type="ratingText" className="text-xs text-black-500">
              {"Durée moyenne de visite"}
            </CustomText>
            <CustomText
              type="ratingText"
              className="font-semibold text-black-700"
            >
              {durationText}
            </CustomText>
          </Box>
        </Box>
      </Box>
    );
  },
);

AverageVisitDurationSection.displayName = "AverageVisitDurationSection";
