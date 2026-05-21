import { Platform } from "react-native";
import notifee, {
  type AndroidChannel,
  AndroidImportance,
} from "react-native-notify-kit";

import { logger } from "@/utils/logger";

export type NotificationChannelId =
  | "activity_progression"
  | "proximity"
  | "inactivity";

interface NotificationChannelDescriptor {
  id: NotificationChannelId;
  importance: AndroidImportance;
  vibration: boolean;
}

export const NOTIFICATION_CHANNEL_DESCRIPTORS: NotificationChannelDescriptor[] =
  [
    {
      id: "activity_progression",
      importance: AndroidImportance.HIGH,
      vibration: true,
    },
    {
      id: "proximity",
      importance: AndroidImportance.HIGH,
      vibration: true,
    },
    {
      id: "inactivity",
      importance: AndroidImportance.DEFAULT,
      vibration: false,
    },
  ];

export type NotificationChannelNameResolver = (
  id: NotificationChannelId,
) => string;

/**
 * Declares the 3 Android notification channels used by the app.
 *
 * No-op on iOS (channels are an Android-only concept).
 * Idempotent: re-creating a channel with the same id updates its non-locked
 * fields (e.g. localized name) without resetting user preferences.
 *
 * The caller passes a name resolver so localization stays in the React layer
 * (typically `(id) => t(`notifications.channels.${id}`)`).
 */
export const ensureNotificationChannels = async (
  getChannelName: NotificationChannelNameResolver,
): Promise<void> => {
  if (Platform.OS !== "android") {
    return;
  }
  try {
    const channels: AndroidChannel[] = NOTIFICATION_CHANNEL_DESCRIPTORS.map(
      (descriptor) => ({
        id: descriptor.id,
        name: getChannelName(descriptor.id),
        importance: descriptor.importance,
        vibration: descriptor.vibration,
      }),
    );
    await notifee.createChannels(channels);
  } catch (error) {
    logger("[NotificationChannels] Failed to create channels", error);
  }
};
