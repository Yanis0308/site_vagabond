import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  checkNotifications,
  type PermissionStatus,
  requestNotifications,
  RESULTS,
} from "react-native-permissions";

import { trackEvent } from "@/lib/analytics/analytics";
import { type NotifPermissionStatus } from "@/lib/analytics/events";
import { locationPermissionResolvedAtom } from "@/stores/locationPermissionResolvedAtom";
import { usePushPermissionEverRequested } from "@/stores/pushPermissionEverRequestedAtom";
import { usePushPrePromptShownCount } from "@/stores/pushPrePromptShownCountAtom";
import { logger } from "@/utils/logger";

const toAnalyticsStatus = (status: PermissionStatus): NotifPermissionStatus =>
  status === RESULTS.GRANTED
    ? "granted"
    : status === RESULTS.LIMITED
      ? "provisional"
      : "denied";

const PRE_PROMPT_DELAY_AFTER_LOCATION_RESPONSE_MS = 3_000;

interface UsePushPermissionPromptResult {
  isOpen: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Drives the in-app pre-prompt that introduces push notifications.
 *
 * V0 contract:
 * - Only shown once per install (count > 0 → never again).
 * - iOS: only shown when the OS hasn't asked yet (rn-permissions returns
 *   DENIED for that state — iOS never returns BLOCKED until the user has
 *   denied at least once, and GRANTED/LIMITED means it's already done).
 * - Android: there's no real "not asked" state distinct from "soft-denied"
 *   in the OS — rn-permissions returns DENIED for both. We rely on the
 *   local counter (checked above) as the source of truth and only bail when
 *   the user is already GRANTED (notifications enabled in OS settings).
 * - Trigger: 3s after the user responds to the location permission prompt
 *   (granted or denied, doesn't matter — we just want a calm moment so we
 *   don't stack two native modals). The resolution is signalled by
 *   `locationPermissionResolvedAtom`, flipped by `useUserLocationWatcher`.
 * - On accept: fires the native OS permission prompt. The actual token
 *   upsert is handled by usePushDeviceRegistration on the next app start
 *   (or current run if it re-evaluates).
 * - On dismiss: silently increments the counter so we don't re-prompt.
 */
export const usePushPermissionPrompt = (): UsePushPermissionPromptResult => {
  const { count, isHydrated, incrementCount } = usePushPrePromptShownCount();
  const { markRequested } = usePushPermissionEverRequested();
  const locationPermissionResolved = useAtomValue(
    locationPermissionResolvedAtom,
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated || count > 0 || !locationPermissionResolved) {
      return;
    }

    let cancelled = false;
    let showTimerId: ReturnType<typeof setTimeout> | null = null;

    const start = async (): Promise<void> => {
      try {
        const { status } = await checkNotifications();
        if (cancelled) {
          return;
        }

        if (Platform.OS === "ios") {
          if (status !== RESULTS.DENIED) {
            return;
          }
        } else {
          if (status === RESULTS.GRANTED) {
            return;
          }
        }

        showTimerId = setTimeout(() => {
          if (!cancelled) {
            setIsOpen(true);
            void trackEvent("notif_prompt_shown", { source: "pre_prompt" });
          }
        }, PRE_PROMPT_DELAY_AFTER_LOCATION_RESPONSE_MS);
      } catch (error) {
        logger(
          "[PushPermissionPrompt] OS permission status check failed",
          error,
        );
      }
    };

    void start();

    return (): void => {
      cancelled = true;
      if (showTimerId !== null) {
        clearTimeout(showTimerId);
      }
    };
  }, [isHydrated, count, locationPermissionResolved]);

  const onAccept = (): void => {
    setIsOpen(false);
    void trackEvent("notif_prompt_response", { action: "accepted" });
    void incrementCount();
    void markRequested();
    void requestNotifications(["alert", "badge", "sound"])
      .then(({ status }) => {
        void trackEvent("notif_permission_resolved", {
          source: "pre_prompt",
          status: toAnalyticsStatus(status),
        });
      })
      .catch((error: unknown) => {
        logger("[PushPermissionPrompt] requestNotifications failed", error);
      });
  };

  const onDismiss = (): void => {
    setIsOpen(false);
    void trackEvent("notif_prompt_response", { action: "dismissed" });
    void incrementCount();
  };

  return { isOpen, onAccept, onDismiss };
};
