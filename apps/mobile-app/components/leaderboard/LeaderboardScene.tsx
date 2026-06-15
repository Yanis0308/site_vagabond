import { FlashList } from "@shopify/flash-list";
import { type LeaderboardUser } from "@vagabond/shared-utils";
import React, { memo, type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { CustomText } from "@/components/custom-ui/CustomText";
import { LeaderboardUserItem } from "@/components/custom-ui/LeaderboardUserItem";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Spinner } from "@/components/ui/spinner";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";

interface LeaderboardSceneProps {
  searchTerm: string;
  currentUser: { id: string } | undefined;
  period: "all-time" | "monthly";
}

export const LeaderboardScene = memo(
  ({
    searchTerm,
    currentUser,
    period,
  }: LeaderboardSceneProps): ReactElement => {
    const { t } = useTranslation("common");
    const {
      items,
      isLoading,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      appliedSearchTerm,
    } = useLeaderboard({ period, searchTerm });

    const keyExtractor = (item: LeaderboardUser): string => item.userId;

    const renderItem = ({ item }: { item: LeaderboardUser }): ReactElement => (
      <LeaderboardUserItem
        user={item}
        isCurrentUser={item.userId === currentUser?.id}
      />
    );

    const ItemSeparatorComponent = (): ReactElement => <Box className="h-1" />;

    const onEndReached = (): void => {
      if (hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    };

    const ListFooterComponent = (): ReactElement | null =>
      hasNextPage ? (
        <Box className="w-full items-center justify-center py-6">
          {isFetchingNextPage ? (
            <Spinner size="large" color={themeColors.primary[500].hex} />
          ) : null}
        </Box>
      ) : null;

    if (isLoading) {
      return (
        <Box className="flex-1 items-center justify-center px-4">
          <Spinner size="large" color={themeColors.primary[500].hex} />
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Box className="flex-1 items-center justify-center px-4">
          <CustomText className="text-gray-500">
            {appliedSearchTerm !== ""
              ? t("leaderboard.result_none", {
                  period: t(`leaderboard.period.${period}`),
                })
              : t("leaderboard.empty")}
          </CustomText>
        </Box>
      );
    }

    return (
      <Box className="flex-1 px-4 pt-2">
        {appliedSearchTerm !== "" && (
          <CustomText className="my-2 font-bold">
            {/* Pluriel géré nativement par i18next (result_one / result_other). */}
            {t("leaderboard.result", {
              count: items.length,
              period: t(`leaderboard.period.${period}`),
            })}
          </CustomText>
        )}
        <FlashList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparatorComponent}
          onEndReached={hasNextPage ? onEndReached : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooterComponent}
        />
      </Box>
    );
  },
);

LeaderboardScene.displayName = "LeaderboardScene";
