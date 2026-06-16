import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from "@react-native-firebase/messaging";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { checkNotifications, RESULTS } from "react-native-permissions";

import { useRegisterPushDevice } from "@/hooks/mutations/useRegisterPushDevice";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import {
  isPushDeviceCacheStale,
  readPushDeviceCache,
  writePushDeviceCache,
} from "@/stores/pushDeviceCacheAtom";
import { logger } from "@/utils/logger";

const resolvePlatform = (): "ios" | "android" | null => {
  if (Platform.OS === "ios") {
    return "ios";
  }
  if (Platform.OS === "android") {
    return "android";
  }
  return null;
};

// "1.1.0 (42)" when a native build number is available, otherwise the
// semver alone. The build number changes at every store submission while the
// semver rarely moves — both together help target push-specific regressions.
const resolveAppVersion = (): string => {
  const semver = Constants.expoConfig?.version ?? "unknown";
  const buildNumber = Application.nativeBuildVersion;
  return buildNumber === null ? semver : `${semver} (${buildNumber})`;
};

/**
 * Synchronizes the device's FCM token with the API.
 *
 * - Upserts the token on mount when permission is already granted.
 * - Re-upserts whenever FCM rotates the token (onTokenRefresh).
 * - Re-upserts whenever the app returns to foreground (covers the case where
 *   the user granted permission mid-session and FCM did not rotate the token).
 * - Re-upserts when the authenticated user changes, even if the token itself
 *   hasn't rotated, so the backend mapping stays correct on shared devices.
 * - Re-upserts when the local cache is older than the TTL, so `lastSeenAt` is
 *   refreshed and any server-side `disabledAt` (token-not-registered) is
 *   cleared as soon as the device proves it's still active.
 */
export const usePushDeviceRegistration = (): void => {
  const authenticatedUser = useAtomValue(authenticatedUserAtom);
  const { mutate: registerPushDevice } = useRegisterPushDevice();

  useEffect(() => {
    // Source of truth for identity is the Firebase uid (= API users.userId).
    // The atom carries display info only.
    const userId = getAuth().currentUser?.uid;
    if (authenticatedUser === null || userId === undefined) {
      return;
    }

    const messaging = getMessaging(getApp());
    let cancelled = false;

    const syncToken = async (token: string): Promise<void> => {
      const platform = resolvePlatform();
      if (platform === null) {
        logger(
          "[PushDeviceRegistration] Unsupported platform, skipping upsert",
        );
        return;
      }

      try {
        const appVersion = resolveAppVersion();
        const osVersion = Device.osVersion ?? "unknown";
        const deviceModel = Device.modelName ?? undefined;

        const cached = await readPushDeviceCache();
        if (cancelled) {
          return;
        }
        if (
          cached?.userId === userId &&
          cached.token === token &&
          cached.appVersion === appVersion &&
          cached.osVersion === osVersion &&
          !isPushDeviceCacheStale(cached)
        ) {
          logger(
            "[PushDeviceRegistration] Cache hit for current user/token/env and fresh, skipping",
          );
          return;
        }

        registerPushDevice(
          {
            token,
            platform,
            appVersion,
            osVersion,
            deviceModel,
          },
          {
            onSuccess: (): void => {
              if (cancelled) {
                return;
              }
              void writePushDeviceCache({
                userId,
                token,
                appVersion,
                osVersion,
              });
            },
          },
        );
      } catch (error) {
        logger("[PushDeviceRegistration] Failed to sync token", error);
      }
    };

    const runInitialSync = async (): Promise<void> => {
      try {
        const { status } = await checkNotifications();
        if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
          logger(
            "[PushDeviceRegistration] Permission not granted, skipping initial registration",
          );
          return;
        }

        const token = await getToken(messaging);
        if (cancelled) {
          return;
        }
        await syncToken(token);
      } catch (error) {
        logger("[PushDeviceRegistration] Initial registration failed", error);
      }
    };

    void runInitialSync();

    const unsubscribeOnTokenRefresh = onTokenRefresh(
      messaging,
      (token: string): void => {
        void (async (): Promise<void> => {
          try {
            // FCM/APNs can produce a token without notification permission
            // (Android auto-init, iOS auto-register for silent push). Gate the
            // upsert on the OS permission so we never persist a token for a
            // user who hasn't opted in.
            const { status } = await checkNotifications();
            if (cancelled) {
              return;
            }
            if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
              logger(
                "[PushDeviceRegistration] Permission not granted, skipping token refresh upsert",
              );
              return;
            }
            await syncToken(token);
          } catch (error) {
            logger(
              "[PushDeviceRegistration] Token refresh upsert failed",
              error,
            );
          }
        })();
      },
    );

    // Re-evaluate on app foreground: covers the case where the user granted
    // permission via OS settings (or via the pre-prompt acceptance that
    // didn't rotate the token) while we were already mounted.
    const appStateSub = AppState.addEventListener("change", (status): void => {
      if (status === "active") {
        void runInitialSync();
      }
    });

    return (): void => {
      cancelled = true;
      unsubscribeOnTokenRefresh();
      appStateSub.remove();
    };
  }, [authenticatedUser, registerPushDevice]);
};
