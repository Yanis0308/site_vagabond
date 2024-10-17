import "@/global.css";
import "react-native-reanimated";
import "../global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { queryClient } from "@/constants/QueryClient";
import { SessionProvider } from "@/contexts/AuthContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- screen file so it's ok
export default function RootLayout(): ReactElement | null {
  void Location.enableNetworkProviderAsync();

  const [loaded] = useFonts(
    useMemo(
      () => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it's ok it's a font
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
      }),
      [],
    ),
  );

  const [defaultSession] = useState(SecureStore.getItem("session"));

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SessionProvider defaultSession={defaultSession}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GluestackUIProvider>
            <SafeAreaProvider>
              <Stack>
                <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="place-details/[place]"
                  options={{
                    headerBackTitleVisible: false,
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
            </SafeAreaProvider>
          </GluestackUIProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SessionProvider>
  );
}
