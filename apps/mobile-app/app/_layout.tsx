import "@/global.css";
import "react-native-reanimated";
import "../global.css";

import auth from "@react-native-firebase/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { queryClient } from "@/constants/QueryClient";
import { logger } from "@/utils/logger";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function RootLayout(): ReactElement | null {
  // void Location.enableNetworkProviderAsync();

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      logger("onAuthStateChanged user:", typeof user);
      setInitializing((prevInitializing) => {
        if (prevInitializing) {
          return false;
        }
        return prevInitializing;
      });
    });
    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  const onLayoutRootView = useCallback(() => {
    if (!initializing) {
      SplashScreen.hide();
    }
  }, [initializing]);

  if (initializing) {
    logger("=== RootLayout return null");
    return null;
  }

  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <SafeAreaView style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="place-details/[place]"
                options={{
                  headerBackTitle: "Back",
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </SafeAreaView>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
