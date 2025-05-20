import { getAuth } from "@react-native-firebase/auth";
import { Redirect, Tabs, usePathname } from "expo-router";
import React, { type ReactElement, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { logger } from "@/utils/logger";

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function TabLayout(): ReactElement {
  const { t } = useTranslation("common");
  const user = getAuth().currentUser;
  const pathname = usePathname();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
    }),
    [],
  );

  if (user === null) {
    logger("--- You're disconnected and redirected to sign-in page");
    return <Redirect href="/sign-in" />;
  } else if (pathname === "/sign-in") {
    logger("--- You're connected and redirected to home page");
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="camera-test"
        options={{
          title: "Camera",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "camera" : "camera-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.map"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "map" : "map-outline"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "person" : "person-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
