import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWindowDimensions } from "react-native";
import { TabView } from "react-native-tab-view";

import { CustomText } from "@/components/custom-ui/CustomText";
import {
  LeaderboardHeader,
  LeaderboardScene,
  LeaderboardTabBar,
} from "@/components/leaderboard";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { Box } from "@/components/ui/box";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { VStack } from "@/components/ui/vstack";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { trackEvent } from "@/lib/analytics/analytics";

interface Route {
  key: string;
  title: string;
}

export default function Leaderboard(): ReactElement {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const { data: currentUser } = useUsersMe();

  const [routes] = useState<Route[]>([
    { key: "all-time", title: "Global" },
    { key: "monthly", title: "Mensuel" },
  ]);

  const renderScene = useCallback(
    ({ route }: { route: Route }): ReactElement | null => {
      if (route.key === "all-time" || route.key === "monthly") {
        return (
          <LeaderboardScene currentUser={currentUser} period={route.key} />
        );
      }
      return null;
    },
    [currentUser],
  );

  const renderTabBar = useCallback(
    (props: Parameters<typeof LeaderboardTabBar>[0]) => (
      <LeaderboardTabBar {...props} />
    ),
    [],
  );

  const initialLayout = useMemo(
    () => ({ width: layout.width }),
    [layout.width],
  );

  const navigationState = useMemo(() => ({ index, routes }), [index, routes]);

  const currentPeriod = useMemo(
    () => (index === 0 ? "all-time" : "monthly"),
    [index],
  );

  useEffect(() => {
    void trackEvent("leaderboard_viewed", {
      period: index === 0 ? "all_time" : "monthly",
    });
  }, [index]);

  const options = useMemo(
    () => ({
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
    }),
    [],
  );

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={true}
    >
      <Box className="flex size-full">
        <VStack className="flex size-full">
          {/* Header avec stats */}
          <LeaderboardHeader currentUser={currentUser} period={currentPeriod} />

          {/* TabView */}
          <Box className="flex-1">
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
