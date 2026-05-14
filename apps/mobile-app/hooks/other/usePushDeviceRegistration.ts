import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import {
  AuthorizationStatus,
  type FirebaseMessagingTypes,
  getMessaging,
  getToken,
  hasPermission,
  onTokenRefresh,
} from "@react-native-firebase/messaging";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useRegisterPushDevice } from "@/hooks/mutations/useRegisterPushDevice";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import {
  readPushDeviceCache,
  writePushDeviceCache,
} from "@/stores/pushDeviceCacheAtom";
import { logger } from "@/utils/logger";

const isPermissionGranted = (
  status: FirebaseMessagingTypes.AuthorizationStatus,
): boolean =>
  status === AuthorizationStatus.AUTHORIZED ||
  status === AuthorizationStatus.PROVISIONAL;

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
 * - Re-upserts whenever the authenticated user changes, even if the token
 *   itself hasn't rotated, so the backend mapping stays correct on shared
 *   devices or when sign-out cleanup didn't run.
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
          cached.osVersion === osVersion
        ) {
          logger(
            "[PushDeviceRegistration] Cache hit for current user/token/env, skipping",
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
        const status = await hasPermission(messaging);
        if (!isPermissionGranted(status)) {
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

    const unsubscribe = onTokenRefresh(messaging, (token: string): void => {
      void syncToken(token);
    });

    return (): void => {
      cancelled = true;
      unsubscribe();
    };
  }, [authenticatedUser, registerPushDevice]);
};
