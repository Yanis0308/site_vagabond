import { type LeaderboardUser } from "@vagabond/shared-utils";
import { router } from "expo-router";
import React, { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { cn } from "@/utils/cn";
import { getPlainTextDate } from "@/utils/date";

interface LeaderboardUserItemProps {
  user: LeaderboardUser;
  isCurrentUser: boolean;
}

export const LeaderboardUserItem = memo(
  ({ user, isCurrentUser }: LeaderboardUserItemProps): ReactElement => {
    const { i18n } = useTranslation("common");

    const registrationDate = getPlainTextDate({
      locale: i18n.language,
      date: new Date(user.registrationDate),
    });

    const lastVisitedPoiDate =
      user.lastVisitedPoiDate !== null
        ? getPlainTextDate({
            locale: i18n.language,
            date: new Date(user.lastVisitedPoiDate),
          })
        : null;

    const getRankColor = (rank: number): string => {
      if (rank === 1) return "text-yellow-500";
      if (rank === 2) return "text-gray-400";
      if (rank === 3) return "text-orange-600";
      return "text-gray-600";
    };

    const getRankEmoji = (rank: number): string | null => {
      if (rank === 1) return "🥇";
      if (rank === 2) return "🥈";
      if (rank === 3) return "🥉";
      return null;
    };

    const handlePress = (): void => {
      router.push(`/user/${user.userId}`);
    };

    const rankEmoji = getRankEmoji(user.rank);
    const isWinner = rankEmoji !== null;

    return (
      <Pressable onPress={handlePress}>
        <Box
          className={cn(
            "rounded-lg p-2 shadow-sm",
            isCurrentUser
              ? "border-2 border-primary-500 bg-primary-50"
              : "border border-gray-200 bg-white",
          )}
        >
          <HStack className="items-center gap-2">
            {/* Rank */}
            <Box className="w-10 items-center">
              <CustomText
                className={`font-bold ${getRankColor(user.rank)} ${
                  isWinner ? "text-4xl" : "text-xl"
                }`}
              >
                {rankEmoji ?? `#${user.rank}`}
              </CustomText>
            </Box>

            {/* Avatar */}
            <Avatar size="sm" className="bg-primary-200">
              <AvatarFallbackText>
                {user.nickname ?? user.fullName}
              </AvatarFallbackText>
            </Avatar>

            {/* User Info */}
            <VStack className="flex-1 gap-0.5">
              <CustomText className="text-sm font-semibold text-gray-900">
                {user.nickname ?? user.fullName}
              </CustomText>
              <CustomText className="text-xs text-gray-600">
                {`${user.visitedPoisCount} ${user.visitedPoisCount > 1 ? "lieux visités" : "lieu visité"}`}
              </CustomText>
              <VStack className="gap-0">
                <CustomText className="text-xs text-gray-500">
                  {`Inscrit le ${registrationDate}`}
                </CustomText>
                {lastVisitedPoiDate !== null && (
                  <CustomText className="text-xs text-gray-500">
                    {`Dernier lieu visité le ${lastVisitedPoiDate}`}
                  </CustomText>
                )}
              </VStack>
            </VStack>
          </HStack>
        </Box>
      </Pressable>
    );
  },
);

LeaderboardUserItem.displayName = "LeaderboardUserItem";
