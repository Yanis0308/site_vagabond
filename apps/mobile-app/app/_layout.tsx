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

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { FullScreenLoader } from "@/components/validate-place/FullScreenLoader";
import { config } from "@/constants/Config";
import { PERSIST_OPTIONS, queryClient } from "@/constants/QueryClient";
import { defaultScreenOptions } from "@/constants/ScreenOptions";
import { UnifiedAnalyticsService } from "@/lib/analytics/UnifiedAnalyticsService";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import { logger } from "@/utils/logger";

// Initialize unified analytics (includes both Crashlytics and Vexo)
void UnifiedAnalyticsService.getInstance().initialize();

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

        // Determine sign-in method
        const signInMethod = user.providerData[0]?.providerId;

        // Prefetch user profile and set analytics context
        ((): void => {
          // Set unified analytics user context with role (handles both Crashlytics and Vexo)
          void UnifiedAnalyticsService.getInstance().setUserContext({
            email: user.email ?? undefined,
            displayName: user.displayName ?? undefined,
            signInMethod,
            sessionStartTime: new Date().toISOString(),
            userId: user.uid,
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
          });
        })();
      } else {
        // User is signed out
        setAuthenticatedUser(null);

        // Clear unified analytics user context (handles both Crashlytics and Vexo)
        void UnifiedAnalyticsService.getInstance().clearUserContext();
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
    <GluestackUIProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={PERSIST_OPTIONS}
      >
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
      </PersistQueryClientProvider>
    </GluestackUIProvider>
  );
}
