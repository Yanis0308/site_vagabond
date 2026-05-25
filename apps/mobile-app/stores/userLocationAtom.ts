import { type LocationObject } from "expo-location";
import { atom } from "jotai";

export const userLocationAtom = atom<LocationObject | null>(null);

export type LocationPermissionStatus = "unknown" | "granted" | "denied";

export const userLocationPermissionAtom =
  atom<LocationPermissionStatus>("unknown");
