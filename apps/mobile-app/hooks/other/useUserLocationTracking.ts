import { useAtom } from "jotai";
import { useEffect } from "react";

import { useSaveUserLocation } from "@/hooks/mutations/useSaveUserLocation";
import { useUserLocation } from "@/hooks/queries/useUserLocation";
import { authenticatedUserAtom } from "@/stores/authenticatedUserAtom";
import { logger } from "@/utils/logger";

/**
 * Hook that automatically saves the user's position
 * - Throttling is handled by useUserLocationWatcher (timeInterval: 30s, distanceInterval: 5m)
 * - Only if the user is authenticated
 * - Only if permissions are granted
 * - Handles network errors gracefully
 */
export const useUserLocationTracking = (): void => {
  const [authenticatedUser] = useAtom(authenticatedUserAtom);
  const { userLocation } = useUserLocation(); // updated every 30 seconds by useUserLocationWatcher
  const { mutate: saveUserLocationMutation } = useSaveUserLocation();

  useEffect(() => {
    if (authenticatedUser === null) {
      logger("[LocationTracking] User not authenticated, skipping save");
      return;
    }

    if (userLocation === null) {
      logger("[LocationTracking] No location available yet");
      return;
    }

    logger("[LocationTracking] Saving user location");

    saveUserLocationMutation(
      {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        accuracy: userLocation.coords.accuracy ?? null,
        altitude: userLocation.coords.altitude ?? null,
        altitudeAccuracy: userLocation.coords.altitudeAccuracy ?? null,
        heading: userLocation.coords.heading ?? null,
        speed: userLocation.coords.speed ?? null,
        timestamp: userLocation.timestamp,
      },
      {
        onError: (error) => {
          logger("[LocationTracking] Error saving location", error);
        },
        onSuccess: () => {
          logger("[LocationTracking] Location saved successfully");
        },
      },
    );
  }, [userLocation, authenticatedUser, saveUserLocationMutation]);
};
