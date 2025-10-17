import * as Location from "expo-location";

import { useEffect, useState } from "react";

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const setupLocation = async () => {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        status = (await Location.requestForegroundPermissionsAsync()).status;
      }

      if (status === Location.PermissionStatus.GRANTED) {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000 * 10, // 10s
          },
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
        );
      }
    };

    void setupLocation();

    return (): void => {
      if (subscription !== null) {
        subscription.remove();
      }
    };
  }, []);

  return location;
};
