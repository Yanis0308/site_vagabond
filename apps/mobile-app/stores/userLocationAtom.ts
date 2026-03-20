import { type LocationObject } from "expo-location";
import { atom } from "jotai";

export const userLocationAtom = atom<LocationObject | null>(null);
