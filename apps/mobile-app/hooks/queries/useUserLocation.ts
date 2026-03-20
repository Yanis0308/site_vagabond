import { type LocationObject } from "expo-location";
import { useAtomValue } from "jotai";

import { userLocationAtom } from "@/stores/userLocationAtom";

interface SimplifiedLocation {
  latitude: number;
  longitude: number;
}

export interface UserLocationReturn {
  simplifiedLocation: SimplifiedLocation | null;
  userLocation: LocationObject | null;
}

export const useUserLocation = (): UserLocationReturn => {
  const userLocation = useAtomValue(userLocationAtom);

  const simplifiedLocation: SimplifiedLocation | null =
    userLocation !== null
      ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        }
      : null;

  return {
    simplifiedLocation,
    userLocation,
  };
};
