import * as Location from "expo-location";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { Platform } from "react-native";
import { check, PERMISSIONS, request, RESULTS } from "react-native-permissions";

import { locationPermissionResolvedAtom } from "@/stores/locationPermissionResolvedAtom";
import {
  userLocationAtom,
  userLocationPermissionAtom,
} from "@/stores/userLocationAtom";
import { logger } from "@/utils/logger";

const LOCATION_PERMISSION =
  Platform.OS === "ios"
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

export const useUserLocationWatcher = (): void => {
  const setUserLocation = useSetAtom(userLocationAtom);
  const setLocationPermissionResolved = useSetAtom(
    locationPermissionResolvedAtom,
  );
  const setPermissionStatus = useSetAtom(userLocationPermissionAtom);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupLocation = async (): Promise<void> => {
      let status = await check(LOCATION_PERMISSION);
      if (status === RESULTS.DENIED) {
        status = await request(LOCATION_PERMISSION);
      }
      setLocationPermissionResolved(true);

      if (status !== RESULTS.GRANTED) {
        logger("[LocationWatcher] Permission not granted");
        setPermissionStatus("denied");
        return;
      }

      setPermissionStatus("granted");
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
  }, [setUserLocation, setLocationPermissionResolved, setPermissionStatus]);
};
