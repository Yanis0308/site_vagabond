import { Stack } from "expo-router";
import { type ReactElement } from "react";

// TEMP: pré-prompt notifications désactivé — réactiver en décommentant ces deux lignes,
// l'appel du hook et le rendu de <PushPermissionPrePromptModal /> plus bas.
// import { PushPermissionPrePromptModal } from "@/components/notifications/PushPermissionPrePromptModal";
import { defaultScreenOptions } from "@/constants/ScreenOptions";
import { useNotificationOpenListener } from "@/hooks/other/useNotificationOpenListener";
import { usePushDeviceRegistration } from "@/hooks/other/usePushDeviceRegistration";
// import { usePushPermissionPrompt } from "@/hooks/other/usePushPermissionPrompt";
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
  // Synchronise le token FCM avec l'API au mount et à chaque rotation
  usePushDeviceRegistration();
  // Écoute les notifs FCM (background / cold-start → track + nav ; foreground → atom)
  useNotificationOpenListener();
  // TEMP: pré-prompt in-app pour les notifications désactivé temporairement.
  // const pushPermissionPrompt = usePushPermissionPrompt();

  return (
    <>
      <Stack screenOptions={defaultScreenOptions}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="validate-place/review-form" />
        <Stack.Screen name="search" />
        <Stack.Screen
          name="user-feedback/index"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="user-feedback/[placeId]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="user-feedback/place-suggestion"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="user/[userId]" />
        <Stack.Screen
          name="user/edit-nickname"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
      {/* TEMP: pré-prompt notifications désactivé temporairement.
      <PushPermissionPrePromptModal
        isOpen={pushPermissionPrompt.isOpen}
        onAccept={pushPermissionPrompt.onAccept}
        onDismiss={pushPermissionPrompt.onDismiss}
      /> */}
    </>
  );
}
