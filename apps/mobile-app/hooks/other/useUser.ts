import { type FirebaseAuthTypes, getAuth } from "@react-native-firebase/auth";
import { useMemo } from "react";

export const useUser = (): FirebaseAuthTypes.User | null => {
  const user = useMemo(() => {
    return getAuth().currentUser;
  }, []);

  return user;
};
