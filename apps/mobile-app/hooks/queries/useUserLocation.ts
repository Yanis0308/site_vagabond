import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Alert } from "react-native";

import { logger } from "@/utils/logger";

interface UserLocation {
  latitude: number;
  longitude: number;
}

const getUserLocation = async (): Promise<UserLocation | null> => {
  let { status } = await Location.getForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    status = (await Location.requestForegroundPermissionsAsync()).status;
  }

  if (status !== Location.PermissionStatus.GRANTED) {
    Alert.alert("Permission de géolocalisation refusée");
    return null;
  }

  let position = await Location.getLastKnownPositionAsync({
    maxAge: 1000 * 30, // 30s
  });

  position ??= await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const location = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  logger("Position utilisateur récupérée:", location);

  return location;
};

//eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for query
export const useUserLocation = () => {
  return useQuery<UserLocation | null>({
    queryKey: ["userLocation"],
    queryFn: getUserLocation,
    staleTime: 1000 * 30, // 30s
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
