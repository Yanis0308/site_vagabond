import { getApp } from "@react-native-firebase/app";
import {
  type FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";
import { useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

import { useTrackNotificationOpen } from "@/hooks/mutations/useTrackNotificationOpen";
import { incomingNotificationAtom } from "@/stores/incomingNotificationAtom";
import { logger } from "@/utils/logger";
import { parseDeepLink } from "@/utils/parse-deep-link";

interface NotificationPayload {
  notificationId: string;
  deepLink: string;
}

const extractPayload = (
  message: FirebaseMessagingTypes.RemoteMessage,
): NotificationPayload | null => {
  const data = message.data ?? {};
  const notificationId =
    typeof data.notificationId === "string" ? data.notificationId : null;
  if (notificationId === null) {
    return null;
  }
  const deepLink = typeof data.deepLink === "string" ? data.deepLink : "";
  return { notificationId, deepLink };
};

/**
 * Wires the three FCM listeners that surface received notifications to the UI.
 *
 * - onMessage (foreground): publishes the payload on `incomingNotificationAtom`
 *   so <NotificationToast /> can render a sonner toast. We do NOT track an
 *   open here — the user hasn't explicitly acknowledged the notification yet.
 * - onNotificationOpenedApp (background): user tapped the system notification
 *   while the app was already running. Track the open and navigate.
 * - getInitialNotification (cold start): one-shot at mount; if the app was
 *   launched from a notification tap, track the open and navigate.
 *
 * Mounted from the authenticated layout, so a logged-in user is guaranteed.
 */
export const useNotificationOpenListener = (): void => {
  const router = useRouter();
  const { mutate: trackOpen } = useTrackNotificationOpen();
  const setIncomingNotification = useSetAtom(incomingNotificationAtom);

  useEffect(() => {
    const messaging = getMessaging(getApp());
    let cancelled = false;

    const handleOpenedFromSystem = (
      message: FirebaseMessagingTypes.RemoteMessage,
      source: "background" | "cold_start",
    ): void => {
      const payload = extractPayload(message);
      if (payload === null) {
        logger(
          `[NotificationOpenListener] Missing notificationId in ${source} payload`,
          message.data,
        );
        return;
      }
      trackOpen({ notificationId: payload.notificationId, source });
      router.navigate(parseDeepLink(payload.deepLink));
    };

    const consumeColdStart = async (): Promise<void> => {
      try {
        const initial = await getInitialNotification(messaging);
        if (initial === null) {
          return;
        }
        if (cancelled) {
          return;
        }
        handleOpenedFromSystem(initial, "cold_start");
      } catch (error) {
        logger(
          "[NotificationOpenListener] getInitialNotification failed",
          error,
        );
      }
    };

    void consumeColdStart();

    const unsubscribeOpenedApp = onNotificationOpenedApp(
      messaging,
      (message): void => {
        if (cancelled) {
          return;
        }
        handleOpenedFromSystem(message, "background");
      },
    );

    const unsubscribeOnMessage = onMessage(messaging, (message): void => {
      if (cancelled) {
        return;
      }
      const payload = extractPayload(message);
      if (payload === null) {
        logger(
          "[NotificationOpenListener] Missing notificationId in foreground payload",
          message.data,
        );
        return;
      }
      setIncomingNotification({
        notificationId: payload.notificationId,
        title: message.notification?.title,
        body: message.notification?.body,
        deepLink: payload.deepLink,
      });
    });

    return (): void => {
      cancelled = true;
      unsubscribeOpenedApp();
      unsubscribeOnMessage();
    };
  }, [router, setIncomingNotification, trackOpen]);
};
