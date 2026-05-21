import Constants from "expo-constants";
import * as IntentLauncher from "expo-intent-launcher";
import { Linking, Platform } from "react-native";

import { logger } from "@/utils/logger";

/**
 * Opens the OS-level notification settings for the app.
 *
 * - Android: deep-links straight to the app's Notifications page (channels are
 *   listed there), via the `APP_NOTIFICATION_SETTINGS` intent.
 * - iOS: opens the app's Settings page; the user must then tap "Notifications"
 *   to reach the master switch (no deeper deep-link is reliably available).
 */
export const openNotificationSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === "android") {
      const bundleId = Constants.expoConfig?.android?.package;
      if (bundleId === undefined) {
        logger(
          "[NotificationSettings] Missing Android package id, falling back to generic settings",
        );
        await Linking.openSettings();
        return;
      }
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
        {
          extra: { "android.provider.extra.APP_PACKAGE": bundleId },
        },
      );
      return;
    }

    await Linking.openSettings();
  } catch (error) {
    logger("[NotificationSettings] Failed to open OS settings", error);
  }
};
