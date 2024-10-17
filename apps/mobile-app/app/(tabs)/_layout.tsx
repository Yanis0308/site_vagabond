import { Redirect, Tabs } from "expo-router";
import React, { ReactElement, useMemo } from "react";

import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useSession } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function TabLayout(): ReactElement {
  const { session } = useSession();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
    }),
    [],
  );

  if (!session) {
    logger("--- You're disconnected and redirected to sign-in page");
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Carte",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "map" : "map-outline"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
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
