import { type LeaderboardUser } from "@vagabond/shared-utils";
import React, { memo, type ReactElement } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";

interface LeaderboardHeaderProps {
  currentUser:
    | { id: string; fullName?: string | null; email?: string | null }
    | undefined;
  period: "all-time" | "monthly";
}

export const LeaderboardHeader = memo(
  ({ currentUser, period }: LeaderboardHeaderProps): ReactElement => {
    const { data: leaderboardData, isLoading } = useLeaderboard(period);

    if (isLoading || leaderboardData === undefined) {
      return (
        <Box className="p-4">
          <Box className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
            <Spinner size="small" color={themeColors.primary[500].hex} />
          </Box>
        </Box>
      );
    }

    const totalParticipants = leaderboardData.users.length;
    const currentUserData = leaderboardData.users.find(
      (user: LeaderboardUser) => user.userId === currentUser?.id,
    );

    const periodLabel = period === "all-time" ? "Global" : "Mensuel";

    return (
      <Box className="p-4">
        <Box className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
          {/* Titre */}
          <CustomText className="my-2 text-center text-base font-bold text-gray-900">
            {"Votre Classement"}
          </CustomText>

          <HStack className="items-center justify-around py-3">
            {/* Section gauche : Avatar + Rang */}
            <HStack className="items-center gap-3">
              <Avatar
                size="md"
                style={{ backgroundColor: themeColors.primary[200].hex }}
              >
                <AvatarFallbackText>
                  {currentUserData?.fullName}
                </AvatarFallbackText>
              </Avatar>
              {currentUserData !== undefined ? (
                <VStack className="gap-0.5">
                  <CustomText className="text-xl font-bold leading-tight text-gray-900">
                    {`#${currentUserData.rank}/${totalParticipants}`}
                  </CustomText>
                  <CustomText className="text-xs text-gray-600">
                    {periodLabel}
                  </CustomText>
                </VStack>
              ) : (
                <VStack className="gap-0.5">
                  <CustomText className="text-sm text-gray-600">
                    {"Pas encore classé"}
                  </CustomText>
                  <CustomText className="text-xs text-gray-500">
                    {periodLabel}
                  </CustomText>
                </VStack>
              )}
            </HStack>

            {/* Séparateur vertical */}
            <Box className="h-10 w-px bg-gray-300" />

            {/* Section droite : Lieux visités */}
            <VStack className="items-center gap-0.5">
              {currentUserData !== undefined ? (
                <>
                  <CustomText className="text-2xl font-bold leading-tight text-gray-900">
                    {currentUserData.visitedPoisCount}
                  </CustomText>
                  <CustomText className="text-xs text-gray-600">
                    {"Lieux visités"}
                  </CustomText>
                </>
              ) : (
                <>
                  <CustomText className="text-2xl font-bold leading-tight text-gray-300">
                    {"0"}
                  </CustomText>
                  <CustomText className="text-xs text-gray-400">
                    {"Lieux visités"}
                  </CustomText>
                </>
              )}
            </VStack>
          </HStack>
        </Box>
      </Box>
    );
  },
);

LeaderboardHeader.displayName = "LeaderboardHeader";
