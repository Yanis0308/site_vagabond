import "@/global.css";
import "@/localization";

import { getAuth } from "@react-native-firebase/auth";
import Mapbox from "@rnmapbox/maps";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useAtom } from "jotai";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { Toaster } from "sonner-native";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { FullScreenLoader } from "@/components/validate-place/FullScreenLoader";
import { config } from "@/constants/Config";
import { PERSIST_OPTIONS, queryClient } from "@/constants/QueryClient";
import { defaultScreenOptions } from "@/constants/ScreenOptions";
import { useReactQueryFocusManager } from "@/hooks/other/useReactQueryFocusManager";
import { clearUser, identifyUser } from "@/lib/analytics/analytics";
import { AppErrorBoundary } from "@/lib/analytics/error-boundary";
import { useScreenTracking } from "@/lib/analytics/screen-tracking";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import { logger } from "@/utils/logger";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

// Configure Reanimated logger to reduce noise during development
if (__DEV__) {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn, // or error
    strict: false, // 🔕 disable strict warnings
  });
}

export default function RootLayout(): ReactElement | null {
  // void Location.enableNetworkProviderAsync();
  const pathname = usePathname();
  logger("= root layout pathname:", pathname);

  // Analytics screen tracking via Expo Router segments
  useScreenTracking();

  // React Query refetch on focus (tab switch + app foreground)
  useReactQueryFocusManager();

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
    return getAuth().onAuthStateChanged((user) => {
      logger("onAuthStateChanged user:", JSON.stringify(user));

      if (user !== null) {
        // User is signed in
        const userContext = {
          email: user.email ?? "empty-email",
          displayName: user.displayName ?? "empty-display-name",
        };

        setAuthenticatedUser(userContext);

        // Set analytics user context (Firebase Analytics + Crashlytics)
        void identifyUser({
          userId: user.uid,
          email: user.email ?? undefined,
          displayName: user.displayName ?? undefined,
          signInMethod: user.providerData[0]?.providerId,
        });
      } else {
        // User is signed out
        setAuthenticatedUser(null);
        void clearUser();
      }

      setInitializing((prev) => ({ ...prev, userLoading: false }));
    }); // unsubscribe on unmount
  }, [setAuthenticatedUser]);

  // Mapbox init
  useEffect(() => {
    Mapbox.setAccessToken(config.publicMapboxToken)
      .then(() => {
        Mapbox.setTelemetryEnabled(false);
      })
      .catch((_error: unknown) => {
        logger("Error setting Mapbox access token:", _error);
      });
  }, []);

  // Trying to fix the transparency problem on Android
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync("transparent");
  }, []);

  if (initializing.userLoading) {
    logger("=== RootLayout return null");
    return null;
  }

  return (
    <AppErrorBoundary>
      <GluestackUIProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={PERSIST_OPTIONS}
        >
          <GestureHandlerRootView
            style={{ flex: 1 }}
            onLayout={onLayoutRootView}
          >
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
            <Toaster position="top-center" />
          </GestureHandlerRootView>
        </PersistQueryClientProvider>
      </GluestackUIProvider>
    </AppErrorBoundary>
  );
}
