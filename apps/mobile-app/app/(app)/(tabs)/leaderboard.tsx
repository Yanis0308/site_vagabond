import { type LeaderboardUser } from "@vagabond/shared-utils";
import React, { type ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";
import { TabView } from "react-native-tab-view";

import { CustomText } from "@/components/custom-ui/CustomText";
import { LeaderboardItemSkeleton } from "@/components/custom-ui/LeaderboardItemSkeleton";
import { LeaderboardUserItem } from "@/components/custom-ui/LeaderboardUserItem";
import { SearchInput } from "@/components/custom-ui/SearchInput";
import { LeaderboardScene, LeaderboardTabBar } from "@/components/leaderboard";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { VStack } from "@/components/ui/vstack";
import { useLeaderboardMe } from "@/hooks/queries/useLeaderboardMe";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { trackEvent } from "@/lib/analytics/analytics";

interface Route {
  key: string;
  title: string;
}

export default function Leaderboard(): ReactElement {
  const { t } = useTranslation("common");
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: currentUser } = useUsersMe();

  const [routes] = useState<Route[]>([
    { key: "all-time", title: "Global" },
    { key: "monthly", title: "Mensuel" },
  ]);

  const period = index === 0 ? "all-time" : "monthly";
  const { data: meData } = useLeaderboardMe(period);

  // Représentation "non classé" de l'utilisateur courant (aucun lieu validé) :
  // on réutilise LeaderboardUserItem qui gère cet état (rank/visitedPoisCount à 0)
  // plutôt qu'un composant placeholder dédié.
  const unrankedCurrentUser: LeaderboardUser | null =
    currentUser !== undefined
      ? {
          userId: currentUser.id,
          fullName: currentUser.fullName,
          nickname: currentUser.nickname,
          visitedPoisCount: 0,
          rank: 0,
          registrationDate: currentUser.createdAt,
          lastVisitedPoiDate: null,
        }
      : null;

  const renderScene = ({ route }: { route: Route }): ReactElement | null => {
    if (route.key === "all-time" || route.key === "monthly") {
      return (
        <LeaderboardScene
          searchTerm={searchTerm}
          currentUser={currentUser}
          period={route.key}
        />
      );
    }
    return null;
  };

  const renderTabBar = (
    props: Parameters<typeof LeaderboardTabBar>[0],
  ): ReactElement => <LeaderboardTabBar {...props} />;

  const initialLayout = { width: layout.width };

  const navigationState = { index, routes };

  useEffect(() => {
    void trackEvent("leaderboard_viewed", {
      period: index === 0 ? "all_time" : "monthly",
    });
  }, [index]);

  const options = {
    "all-time": {
      label: ({
        focused,
        labelText,
      }: {
        focused: boolean;
        labelText?: string;
      }): ReactElement => (
        <CustomText
          style={{
            color: focused
              ? themeColors.primary[500].hex
              : themeColors.secondary[500].hex,
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          {labelText ?? "Global"}
        </CustomText>
      ),
    },
    monthly: {
      label: ({
        focused,
        labelText,
      }: {
        focused: boolean;
        labelText?: string;
      }): ReactElement => (
        <CustomText
          style={{
            color: focused
              ? themeColors.primary[500].hex
              : themeColors.secondary[500].hex,
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          {labelText ?? "Mensuel"}
        </CustomText>
      ),
    },
  };

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={true}
    >
      <Box className="flex size-full">
        <VStack className="flex size-full">
          {meData === undefined ? (
            <Box className="px-4 pb-2 pt-2">
              <LeaderboardItemSkeleton />
            </Box>
          ) : meData.me !== null ? (
            <Box className="px-4 pb-2 pt-2">
              <LeaderboardUserItem user={meData.me} isCurrentUser />
            </Box>
          ) : unrankedCurrentUser !== null ? (
            <Box className="px-4 pb-2 pt-2">
              <LeaderboardUserItem user={unrankedCurrentUser} isCurrentUser />
            </Box>
          ) : null}
          <Box className="flex flex-row px-4 pb-2 pt-2">
            <SearchInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={t("leaderboard.search_placeholder")}
            />
          </Box>
          {/* TabView */}
          <Box className="flex-1 border-t border-gray-200">
            <TabView
              navigationState={navigationState}
              renderScene={renderScene}
              onIndexChange={setIndex}
              initialLayout={initialLayout}
              renderTabBar={renderTabBar}
              options={options}
            />
          </Box>
        </VStack>
      </Box>
    </CustomScreenContainer>
  );
}
