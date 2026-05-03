import "@/global.css";
import "@/localization";

import { getAuth } from "@react-native-firebase/auth";
import Mapbox from "@rnmapbox/maps";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactElement, useEffect } from "react";
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
import {
  authenticatedUserAtom,
  authReadyAtom,
} from "@/stores/authenticatedUserAtom";
import { logger } from "@/utils/logger";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });

// Configure Reanimated logger to reduce noise during development
if (__DEV__) {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn, // or error
    strict: false, // 🔕 disable strict warnings
  });
}

export default function RootLayout(): ReactElement {
  const pathname = usePathname();
  const authenticatedUser = useAtomValue(authenticatedUserAtom);
  const setAuthenticatedUser = useSetAtom(authenticatedUserAtom);
  const setAuthReady = useSetAtom(authReadyAtom);

  // Analytics screen tracking via Expo Router segments
  useScreenTracking();

  // React Query refetch on focus (tab switch + app foreground)
  useReactQueryFocusManager();

  useEffect(() => {
    logger("= root layout pathname:", pathname);
  }, [pathname]);

  useEffect(() => {
    // this listener is automatically triggered at least once
    return getAuth().onAuthStateChanged((user) => {
      logger("onAuthStateChanged user:", JSON.stringify(user));
      if (user !== null) {
        setAuthenticatedUser({
          email: user.email ?? "empty-email",
          displayName: user.displayName ?? "empty-display-name",
        });
        void identifyUser({
          userId: user.uid,
          email: user.email ?? undefined,
          displayName: user.displayName ?? undefined,
          signInMethod: user.providerData[0]?.providerId,
        });
      } else {
        setAuthenticatedUser(null);
        void clearUser();
      }
      setAuthReady(true);
    });
  }, [setAuthenticatedUser, setAuthReady]);

  const authReady = useAtomValue(authReadyAtom);
  useEffect(() => {
    if (authReady) {
      // timeout to force trigger on the next react commit
      const timer = setTimeout(() => {
        void SplashScreen.hideAsync();
      }, 0);
      return (): void => {
        clearTimeout(timer);
      };
    }
  }, [authReady]);

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

  return (
    <AppErrorBoundary>
      <GluestackUIProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={PERSIST_OPTIONS}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
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
