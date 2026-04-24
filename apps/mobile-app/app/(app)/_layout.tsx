import { Stack } from "expo-router";
import { type ReactElement } from "react";

import { defaultScreenOptions } from "@/constants/ScreenOptions";
import { useStartupPhotoRecovery } from "@/hooks/other/useStartupPhotoRecovery";
import { useUserLocationTracking } from "@/hooks/other/useUserLocationTracking";
import { useUserLocationWatcher } from "@/hooks/other/useUserLocationWatcher";

export default function RootLayout(): ReactElement | null {
  // GPS watcher unique — alimente l'atom partagé
  useUserLocationWatcher();
  // Sauvegarder automatiquement la position de l'utilisateur
  useUserLocationTracking();
  // Re-upload any photos that failed during a previous session
  useStartupPhotoRecovery();

  return (
    <Stack screenOptions={defaultScreenOptions}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="validate-place/review-form" />
      <Stack.Screen name="search" />
      <Stack.Screen
        name="user-feedback/[placeId]"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen name="user/[userId]" />
      <Stack.Screen
        name="user/edit-nickname"
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}
