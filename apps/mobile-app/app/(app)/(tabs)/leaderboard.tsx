import { FlashList } from "@shopify/flash-list";
import React, { type ReactElement, useCallback, useState } from "react";

import { CustomText } from "@/components/custom-ui/CustomText";
import { LeaderboardUserItem } from "@/components/custom-ui/LeaderboardUserItem";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import { useLeaderboard } from "@/hooks/queries/useLeaderboard";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { type LeaderboardUser } from "@/http/leaderboard";

type Period = "all-time" | "monthly";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- tab file so it's ok
export default function Leaderboard(): ReactElement {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all-time");
  const { data: leaderboardData, isLoading } = useLeaderboard(selectedPeriod);
  const { data: currentUser } = useUsersMe();

  const onPress = useCallback(() => setSelectedPeriod("all-time"), []);
  const _onPress = useCallback(() => setSelectedPeriod("monthly"), []);
  const keyExtractor = useCallback((item: LeaderboardUser) => item.userId, []);

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardUser }) => (
      <LeaderboardUserItem
        user={item}
        isCurrentUser={item.userId === currentUser?.id}
      />
    ),
    [currentUser?.id],
  );

  const ItemSeparatorComponent = useCallback(() => <Box className="h-2" />, []);
  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={true}
    >
      <Box className="flex size-full">
        <VStack className="flex size-full">
          {/* Header avec titre */}
          <Box className="px-4 py-6">
            <CustomText className="text-center text-2xl font-bold text-primary-500">
              {"Leaderboard"}
            </CustomText>
          </Box>

          {/* Onglets */}
          <HStack className="gap-2 px-4 pb-4">
            <Button
              onPress={onPress}
              action={selectedPeriod === "all-time" ? "primary" : "secondary"}
              className="flex-1"
            >
              <ButtonText>{"Global"}</ButtonText>
            </Button>
            <Button
              onPress={_onPress}
              action={selectedPeriod === "monthly" ? "primary" : "secondary"}
              className="flex-1"
            >
              <ButtonText>{"Mensuel"}</ButtonText>
            </Button>
          </HStack>

          {/* Liste des utilisateurs */}
          <Box className="flex-1 px-4">
            {isLoading ? (
              <Box className="flex-1 items-center justify-center">
                <Spinner size="large" color={themeColors.primary[500].hex} />
              </Box>
            ) : leaderboardData?.users !== undefined &&
              leaderboardData.users.length > 0 ? (
              <FlashList
                data={leaderboardData.users}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ItemSeparatorComponent={ItemSeparatorComponent}
              />
            ) : (
              <Box className="flex-1 items-center justify-center">
                <CustomText className="text-gray-500">
                  {"Aucun utilisateur dans le classement"}
                </CustomText>
              </Box>
            )}
          </Box>
        </VStack>
      </Box>
    </CustomScreenContainer>
  );
}
