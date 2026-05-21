import { atom } from "jotai";

// Flipped to `true` by `useUserLocationWatcher` once the OS has responded to
// the location permission flow (granted/denied — only the resolution matters).
// Lets the push pre-prompt hook react without polling. In-memory only:
// recomputed on every cold start.
export const locationPermissionResolvedAtom = atom<boolean>(false);
