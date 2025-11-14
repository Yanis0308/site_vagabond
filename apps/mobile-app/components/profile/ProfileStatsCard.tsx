import { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { getPlainTextDate } from "@/utils/date";

interface ProfileStatsCardProps {
  label: string;
  value: number;
  emoji?: string;
  lastVisitedDate?: Date;
  lastVisitedPlaceName?: string;
  total?: number;
}

export const ProfileStatsCard = memo(
  ({
    label,
    value,
    emoji,
    lastVisitedDate,
    lastVisitedPlaceName,
    total,
  }: ProfileStatsCardProps): ReactElement => {
    const { i18n, t } = useTranslation("common");

    const displayValue = total !== undefined ? `${value} / ${total}` : value;

    return (
      <Box className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <VStack className="items-center gap-2">
          {lastVisitedDate !== undefined ? (
            <>
              <HStack className="items-center gap-2">
                {emoji !== undefined && (
                  <CustomText className="text-4xl" style={{ fontSize: 32 }}>
                    {emoji}
                  </CustomText>
                )}
                <CustomText className="text-2xl font-bold text-gray-900">
                  {displayValue}
                </CustomText>
                <CustomText className="text-sm text-gray-600">
                  {label}
                </CustomText>
              </HStack>
              <CustomText className="text-center text-xs text-gray-500">
                {lastVisitedPlaceName !== undefined
                  ? t("last_place_visited_on", {
                      placeName: lastVisitedPlaceName,
                      date: getPlainTextDate({
                        locale: i18n.language,
                        date: lastVisitedDate,
                      }),
                    })
                  : t("last_place_visited_on_no_name", {
                      date: getPlainTextDate({
                        locale: i18n.language,
                        date: lastVisitedDate,
                      }),
                    })}
              </CustomText>
            </>
          ) : (
            <>
              <HStack className="items-center gap-2">
                {emoji !== undefined && (
                  <CustomText className="text-4xl" style={{ fontSize: 32 }}>
                    {emoji}
                  </CustomText>
                )}
                <CustomText className="text-2xl font-bold text-gray-900">
                  {displayValue}
                </CustomText>
              </HStack>
              <CustomText className="text-center text-sm text-gray-600">
                {label}
              </CustomText>
            </>
          )}
        </VStack>
      </Box>
    );
  },
);

ProfileStatsCard.displayName = "ProfileStatsCard";
