import "@/global.css";
import "react-native-reanimated";
import "../global.css";
import "@/localization";

import { getAuth } from "@react-native-firebase/auth";
import Mapbox from "@rnmapbox/maps";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { config } from "@/constants/Config";
import { queryClient } from "@/constants/QueryClient";
import { logger } from "@/utils/logger";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function RootLayout(): ReactElement | null {
  // void Location.enableNetworkProviderAsync();

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const subscriber = getAuth().onAuthStateChanged((user) => {
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

  useEffect(() => {
    Mapbox.setAccessToken(config.publicMapboxToken)
      .then(() => {
        Mapbox.setTelemetryEnabled(false);
      })
      .catch((error: unknown) => {
        logger("Error setting Mapbox access token:", error);
      });
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (!initializing) {
      SplashScreen.hide();
    }
  }, [initializing]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      headerBackButtonDisplayMode: "minimal" as const,
      headerTitle: "",
      headerShadowVisible: false,
      headerTintColor: "white",
    }),
    [],
  );

  if (initializing) {
    logger("=== RootLayout return null");
    return null;
  }

  //TODO: ajouter Guard sur les Screens https://docs.expo.dev/router/advanced/authentication/
  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={{ flex: 1 }}>
          <GestureHandlerRootView
            style={{ flex: 1 }}
            onLayout={onLayoutRootView}
          >
            <KeyboardProvider>
              <Stack screenOptions={screenOptions}>
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="validate-place/[place]" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaView>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
