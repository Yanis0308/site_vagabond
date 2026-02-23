import { getAuth } from "@react-native-firebase/auth";
import { useQuery } from "@tanstack/react-query";
import type { UserMe } from "@vagabond/shared-utils";

import { getMe } from "@/http/users";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for query
export const useUsersMe = () => {
  return useQuery<UserMe>({
    queryKey: ["users", "me"],
    queryFn: getMe,
    enabled: getAuth().currentUser !== null,
  });
};
