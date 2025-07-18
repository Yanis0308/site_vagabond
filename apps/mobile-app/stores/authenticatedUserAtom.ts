import { getAuth } from "@react-native-firebase/auth";
import { atom } from "jotai";

interface AuthenticatedUserType {
  email: string;
  displayName: string;
}

const user = getAuth().currentUser;

export const authenticatedUserAtom = atom<AuthenticatedUserType | null>(
  user !== null
    ? {
        email: user.email ?? "empty-email",
        displayName: user.displayName ?? "empty-display-name",
      }
    : null,
);
