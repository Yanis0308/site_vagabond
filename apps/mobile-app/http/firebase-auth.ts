import { getAuth, getIdToken } from "@react-native-firebase/auth";

export function hasAuthenticatedUser(): boolean {
  return getAuth().currentUser !== null;
}

/**
 * Returns the current Firebase ID token. Throws if nobody is signed in —
 * callers that allow anonymous requests should guard with
 * `hasAuthenticatedUser()` first. Pass `forceRefresh: true` to bypass the
 * cached token and fetch a fresh one from Firebase (used on 401 retries).
 */
export async function getFirebaseIdToken(
  forceRefresh: boolean,
): Promise<string> {
  const currentUser = getAuth().currentUser;
  if (currentUser === null) {
    throw new Error("User not authenticated");
  }
  return await getIdToken(currentUser, forceRefresh);
}
