import * as Location from "expo-location";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

import { userLocationAtom } from "@/stores/userLocationAtom";
import { logger } from "@/utils/logger";

export const useUserLocationWatcher = (): void => {
  const setUserLocation = useSetAtom(userLocationAtom);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupLocation = async (): Promise<void> => {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        status = (await Location.requestForegroundPermissionsAsync()).status;
      }

      if (status !== Location.PermissionStatus.GRANTED) {
        logger("[LocationWatcher] Permission not granted");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 30_000, // 30 seconds
          distanceInterval: 5, // 5 meters
        },
        setUserLocation,
      );
    };

    void setupLocation();

    return (): void => {
      if (subscription !== null) {
        subscription.remove();
        subscription = null;
      }
    };
  }, [setUserLocation]);
};
