import type { PoiEnrichedData } from "@vagabond/shared-utils";
import { memo, type ReactNode } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { cn } from "@/utils/cn";

interface SeasonalClosureSectionProps {
  seasonalClosure?: PoiEnrichedData["seasonalClosure"];
  className?: string;
}

// Helper function to format date string (e.g., "01-01" -> "1er janvier")
const formatDate = (dateStr: string): string => {
  try {
    const [day, month] = dateStr.split("-");
    const monthNames = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];
    const dayNum = parseInt(day ?? "0", 10);
    const monthNum = parseInt(month ?? "0", 10) - 1;

    if (dayNum === 1) {
      return `1er ${monthNames[monthNum]}`;
    }
    return `${dayNum} ${monthNames[monthNum]}`;
  } catch {
    return dateStr;
  }
};

export const SeasonalClosureSection = memo(
  ({ seasonalClosure, className }: SeasonalClosureSectionProps): ReactNode => {
    if (seasonalClosure === undefined || seasonalClosure.length === 0) {
      return null;
    }

    return (
      <Box className={cn("bg-white rounded-lg mx-4 mt-6", className)}>
        <CustomText type="rating" className="px-6 py-2 text-primary-700">
          {"Fermeture saisonnière"}
        </CustomText>
        {seasonalClosure.map((closure, index) => {
          const isSameDay = closure.startDate === closure.endDate;
          const dateText = isSameDay
            ? formatDate(closure.startDate)
            : `Du ${formatDate(closure.startDate)} au ${formatDate(closure.endDate)}`;

          return (
            <Box key={index}>
              <Box className="px-6 py-2">
                <CustomText
                  type="ratingText"
                  className="font-semibold text-black-700"
                >
                  {dateText}
                </CustomText>
                {closure.notes !== undefined && closure.notes !== "" && (
                  <CustomText
                    type="ratingText"
                    className="mt-1 text-sm text-black-500"
                  >
                    {closure.notes}
                  </CustomText>
                )}
              </Box>
              {index < seasonalClosure.length - 1 && (
                <Divider className="my-1" />
              )}
            </Box>
          );
        })}
        <Box className="pb-4" />
      </Box>
    );
  },
);

SeasonalClosureSection.displayName = "SeasonalClosureSection";
