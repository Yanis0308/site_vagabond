import "@/global.css";
import "react-native-reanimated";
import "../global.css";
import "@/localization";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import Mapbox from "@rnmapbox/maps";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAtom } from "jotai";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { FullScreenLoader } from "@/components/validate-place/FullScreenLoader";
import { config } from "@/constants/Config";
import { queryClient } from "@/constants/QueryClient";
import { defaultScreenOptions } from "@/constants/ScreenOptions";
import { getMe } from "@/http/users";
import { UnifiedAnalyticsService } from "@/lib/analytics/UnifiedAnalyticsService";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import { logger } from "@/utils/logger";

// Initialize unified analytics (includes both Crashlytics and Vexo)
void UnifiedAnalyticsService.getInstance().initialize();

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
        void (async (): Promise<void> => {
          try {
            const userProfile = await queryClient.fetchQuery({
              queryKey: ["users", "me"],
              queryFn: getMe,
            });

            // Set unified analytics user context with role (handles both Crashlytics and Vexo)
            void UnifiedAnalyticsService.getInstance().setUserContext({
              email: user.email ?? undefined,
              displayName: user.displayName ?? undefined,
              signInMethod,
              sessionStartTime: new Date().toISOString(),
              userId: user.uid,
              creationTime: user.metadata.creationTime,
              lastSignInTime: user.metadata.lastSignInTime,
              role: userProfile.role,
            });
          } catch {
            // Fallback: set analytics without role if API fails
            void UnifiedAnalyticsService.getInstance().setUserContext({
              email: user.email ?? undefined,
              displayName: user.displayName ?? undefined,
              signInMethod,
              sessionStartTime: new Date().toISOString(),
              userId: user.uid,
              creationTime: user.metadata.creationTime,
              lastSignInTime: user.metadata.lastSignInTime,
              role: "USER", // default fallback
            });
          }
        })();
      } else {
        // User is signed out
        setAuthenticatedUser(null);

        // Clear unified analytics user context (handles both Crashlytics and Vexo)
        void UnifiedAnalyticsService.getInstance().clearUserContext();
      }

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
      .catch((_error: unknown) => {
        logger("Error setting Mapbox access token:", _error);
      });
  }, []);

  const persistOptions = useMemo(
    () => ({
      persister: createAsyncStoragePersister({
        storage: AsyncStorage,
      }),
      maxAge: 1000 * 1, //  1 second
    }),
    [],
  );

  if (initializing.userLoading) {
    logger("=== RootLayout return null");
    return null;
  }

  return (
    <GluestackUIProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
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
