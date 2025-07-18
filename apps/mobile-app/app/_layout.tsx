import "@/global.css";
import "react-native-reanimated";
import "../global.css";
import "@/localization";

import { getAuth } from "@react-native-firebase/auth";
import Mapbox from "@rnmapbox/maps";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAtom } from "jotai";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { FullScreenLoader } from "@/components/validate-place/FullScreenLoader";
import { config } from "@/constants/Config";
import { queryClient } from "@/constants/QueryClient";
import { defaultScreenOptions } from "@/constants/ScreenOptions";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import { logger } from "@/utils/logger";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function RootLayout(): ReactElement | null {
  // void Location.enableNetworkProviderAsync();
  const pathname = usePathname();
  logger("= root layout pathname:", pathname);

  // Splash screen management
  const [initializing, setInitializing] = useState({
    userLoading: true,
  });
  const onLayoutRootView = useCallback(() => {
    if (!initializing.userLoading) {
      SplashScreen.hide();
    }
  }, [initializing.userLoading]);

  // Authentification management
  const [authenticatedUser, setAuthenticatedUser] = useAtom(
    authenticatedUserAtom,
  );
  useEffect(() => {
    const subscriber = getAuth().onAuthStateChanged((user) => {
      logger("onAuthStateChanged user:", JSON.stringify(user));
      setAuthenticatedUser(
        user !== null
          ? {
              email: user.email ?? "empty-email",
              displayName: user.displayName ?? "empty-display-name",
            }
          : null,
      );
      setInitializing((prev) => ({ ...prev, userLoading: false }));
    });
    return subscriber; // unsubscribe on unmount
  }, [setAuthenticatedUser]);

  // Mapbox init
  useEffect(() => {
    Mapbox.setAccessToken(config.publicMapboxToken)
      .then(() => {
        Mapbox.setTelemetryEnabled(false);
      })
      .catch((error: unknown) => {
        logger("Error setting Mapbox access token:", error);
      });
  }, []);

  if (initializing.userLoading) {
    logger("=== RootLayout return null");
    return null;
  }

  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <KeyboardProvider>
            <FullScreenLoader />
            <Stack screenOptions={defaultScreenOptions}>
              <Stack.Protected guard={authenticatedUser !== null}>
                <Stack.Screen name="(app)" />
              </Stack.Protected>

              <Stack.Protected guard={authenticatedUser === null}>
                <Stack.Screen name="sign-in" />
              </Stack.Protected>
            </Stack>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
