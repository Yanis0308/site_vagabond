import { getAuth } from "@react-native-firebase/auth";
import { Redirect, usePathname } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import React, { type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { LeaderboardIcon } from "@/components/icons/LeaderboardIcon";
import { MapIcon } from "@/components/icons/MapIcon";
import { ProfileIcon } from "@/components/icons/ProfileIcon";
import { useSafeAreaCustom } from "@/hooks/other/useSafeAreaCustom";
import { cn } from "@/utils/cn";
import { logger } from "@/utils/logger";

export const TAB_BAR_HEIGHT = 60;

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function TabLayout(): ReactElement {
  const { t } = useTranslation("common");
  const user = getAuth().currentUser;
  const pathname = usePathname();
  const insets = useSafeAreaCustom();

  // Déterminer quel onglet est actif basé sur le pathname
  const isLeaderboardActive = pathname === "/leaderboard";
  const isMapActive = pathname === "/";
  const isProfileActive = pathname === "/profile";

  if (user === null) {
    logger("--- You're disconnected and redirected to sign-in page");
    return <Redirect href="/sign-in" />;
  } else if (pathname === "/sign-in") {
    logger("--- You're connected and redirected to home page");
    return <Redirect href="/" />;
  }

  return (
    <Tabs>
      <TabSlot />
      <TabList
        className={cn(
          "absolute bottom-0 flex w-full flex-row items-end justify-between rounded-[40px]",
          "border-2 border-secondary-300 bg-background-100 px-10 pt-3",
          "shadow-[0px_0px_12px_0px] shadow-shadow-polaroidBlock overflow-visible",
        )}
        style={{
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        }}
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
              className={cn(
                "mt-[-32px] flex size-16 items-center justify-center rounded-2xl border-2 shadow-lg",
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
