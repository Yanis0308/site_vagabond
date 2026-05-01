import { atom } from "jotai";

export interface AuthenticatedUserType {
  email: string;
  displayName: string;
}

// VG-294: always initialize to null
// do NOT read getAuth().currentUser at module load. The atom MUST
// start at null so that <Stack> mounts with sign-in initially (login-first
// shape). The Firebase listener in app/_layout.tsx then populates the atom
// post-mount, which adds (app) to <Stack> as an "added-later" route — the
// shape that does not trigger the iOS UIViewController remount cascade on
// first tab switch.
export const authenticatedUserAtom = atom<AuthenticatedUserType | null>(null);

// VG-294: companion flag set to true on the first onAuthStateChanged fire.
// SplashScreenController gates splash hide on this flag so the user does not
// see a flash of sign-in between boot and Firebase resolution.
export const authReadyAtom = atom(false);
