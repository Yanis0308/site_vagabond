import { getUserDisplayName } from "@vagabond/shared-utils";
import React, { memo, type ReactElement } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { Avatar, AvatarFallbackText } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { type LeaderboardUser } from "@/http/leaderboard";

interface LeaderboardUserItemProps {
  user: LeaderboardUser;
  isCurrentUser: boolean;
}

export const LeaderboardUserItem = memo(
  ({ user, isCurrentUser }: LeaderboardUserItemProps): ReactElement => {
    const displayName = getUserDisplayName(user.fullName, user.email);

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

    return (
      <Box
        className={`rounded-lg border bg-white p-4 shadow-sm ${
          isCurrentUser
            ? "border-2 border-primary-500 bg-primary-50"
            : "border-gray-200"
        }`}
      >
        <HStack className="items-center gap-4">
          {/* Rank */}
          <Box className="w-12 items-center">
            <CustomText
              className={`text-2xl font-bold ${getRankColor(user.rank)}`}
            >
              {getRankEmoji(user.rank) ?? `#${user.rank}`}
            </CustomText>
          </Box>

          {/* Avatar */}
          <Avatar size="md" className="bg-primary-200">
            <AvatarFallbackText>{displayName}</AvatarFallbackText>
          </Avatar>

          {/* User Info */}
          <VStack className="flex-1">
            <CustomText className="font-semibold text-gray-900">
              {displayName}
            </CustomText>
            <CustomText className="text-sm text-gray-600">
              {`${user.visitedPoisCount} ${user.visitedPoisCount > 1 ? "lieux visités" : "lieu visité"}`}
            </CustomText>
          </VStack>
        </HStack>
      </Box>
    );
  },
);

LeaderboardUserItem.displayName = "LeaderboardUserItem";
