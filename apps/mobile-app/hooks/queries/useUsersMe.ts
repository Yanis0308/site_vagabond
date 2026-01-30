import { getAuth } from "@react-native-firebase/auth";
import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/http/users";
import { type UsersMeType } from "@/utils/types";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for query
export const useUsersMe = () => {
  return useQuery<UsersMeType>({
    queryKey: ["users", "me"],
    queryFn: getMe,
    enabled: getAuth().currentUser !== null,
  });
};
