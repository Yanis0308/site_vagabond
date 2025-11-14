import React, { memo, type ReactElement, useMemo } from "react";
import { type SceneRendererProps, TabBar } from "react-native-tab-view";

import { themeColors } from "@/components/ui/gluestack-ui-provider/config";

interface Route {
  key: string;
  title: string;
}

interface TabBarProps extends SceneRendererProps {
  navigationState: {
    index: number;
    routes: Route[];
  };
}

export const LeaderboardTabBar = memo((props: TabBarProps): ReactElement => {
  const indicatorStyle = useMemo(
    () => ({
      backgroundColor: themeColors.primary[500].hex,
      height: 3,
    }),
    [],
  );

  return (
    <TabBar
      {...props}
      indicatorStyle={indicatorStyle}
      style={{
        backgroundColor: themeColors.background["200"].hex,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.secondary[300].hex,
      }}
      activeColor={themeColors.primary[500].hex}
      inactiveColor={themeColors.secondary[500].hex}
      pressColor={themeColors.primary[100].hex}
    />
  );
});

LeaderboardTabBar.displayName = "LeaderboardTabBar";
