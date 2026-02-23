import { FlashList } from "@shopify/flash-list";
import { type LeaderboardUser } from "@vagabond/shared-utils";
import React, { memo, type ReactElement, useCallback } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { LeaderboardUserItem } from "@/components/custom-ui/LeaderboardUserItem";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";

interface LeaderboardSceneProps {
  currentUser: { id: string } | undefined;
  period: "all-time" | "monthly";
}

export const LeaderboardScene = memo(
  ({ currentUser, period }: LeaderboardSceneProps): ReactElement => {
    const { data: leaderboardData, isLoading } = useLeaderboard(period);
    const keyExtractor = useCallback(
      (item: LeaderboardUser) => item.userId,
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: LeaderboardUser }) => (
        <LeaderboardUserItem
          user={item}
          isCurrentUser={item.userId === currentUser?.id}
        />
      ),
      [currentUser?.id],
    );

    const ItemSeparatorComponent = useCallback(
      () => <Box className="h-1" />,
      [],
    );

    if (isLoading) {
      return (
        <Box className="flex-1 items-center justify-center px-4">
          <Spinner size="large" color={themeColors.primary[500].hex} />
        </Box>
      );
    }

    if (
      leaderboardData?.users === undefined ||
      leaderboardData.users.length === 0
    ) {
      return (
        <Box className="flex-1 items-center justify-center px-4">
          <CustomText className="text-gray-500">
            {"Aucun utilisateur dans le classement"}
          </CustomText>
        </Box>
      );
    }

    return (
      <Box className="flex-1 px-4 pt-2">
        <FlashList
          data={leaderboardData.users}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparatorComponent}
        />
      </Box>
    );
  },
);

LeaderboardScene.displayName = "LeaderboardScene";
