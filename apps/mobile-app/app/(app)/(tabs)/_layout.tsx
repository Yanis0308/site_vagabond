import { usePathname } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import React, { type ReactElement } from "react";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { LeaderboardIcon } from "@/components/icons/LeaderboardIcon";
import { MapIcon } from "@/components/icons/MapIcon";
import { ProfileIcon } from "@/components/icons/ProfileIcon";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { shadowStyles } from "@/styles/shadows";
import { cn } from "@/utils/cn";

export const TAB_BAR_HEIGHT = 60;

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function TabLayout(): ReactElement {
  const pathname = usePathname();
  const insets = useSafeAreaCustom();

  // Déterminer quel onglet est actif basé sur le pathname
  const isLeaderboardActive = pathname === "/leaderboard";
  const isProfileActive = pathname === "/profile";
  const isMapActive = !isLeaderboardActive && !isProfileActive;

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={{
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          ...shadowStyles.tabBar,
        }}
        className={cn(
          "absolute bottom-0 flex w-full flex-row items-end justify-between rounded-[40px_40px_0px_0px]",
          "border-t-2 border-l-2 border-r-2 border-secondary-300 bg-background-100 px-10",
          "overflow-visible",
        )}
      >
        {/* Leaderboard */}
        <TabTrigger name="leaderboard" href="/leaderboard" className="flex-1">
          <View className="flex flex-1 flex-col items-center justify-center gap-2">
            <View className="flex h-6 items-center justify-center">
              <LeaderboardIcon size={22} active={isLeaderboardActive} />
            </View>
            <CustomText
              className={cn(
                isLeaderboardActive ? "text-primary-400" : "text-secondary-500",
              )}
              type="tabBarTitle"
            >
              {"Leaderboard"}
            </CustomText>
          </View>
        </TabTrigger>

        {/* Map */}
        <TabTrigger name="map" href="/" className="flex-1">
          <View className="flex flex-1 flex-col items-center justify-center gap-2">
            <View
              style={isMapActive ? shadowStyles.tabBarMap : shadowStyles.tabBar}
              className={cn(
                "mt-[-32px] flex size-16 items-center justify-center rounded-2xl border-2",
                isMapActive
                  ? "border-primary-700 bg-primary-400"
                  : "border-secondary-300 bg-secondary-50",
              )}
            >
              <MapIcon size={40} active={isMapActive} />
            </View>

            <CustomText
              className={cn(
                isMapActive ? "text-primary-400" : "text-secondary-500",
              )}
              type="tabBarTitle"
            >
              {"Carte"}
            </CustomText>
          </View>
        </TabTrigger>

        {/* Profile */}
        <TabTrigger name="compte" href="/profile" className="flex-1">
          <View className="flex flex-1 flex-col items-center justify-center gap-2">
            <View className="flex h-6 items-center justify-center">
              <ProfileIcon size={22} active={isProfileActive} />
            </View>
            <CustomText
              className={cn(
                isProfileActive ? "text-primary-400" : "text-secondary-500",
              )}
              type="tabBarTitle"
            >
              {"Profil"}
            </CustomText>
          </View>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
