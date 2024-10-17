import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/contexts/AuthContext";
import { getUsersMe } from "@/http/users-me";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useUserMe = () => {
  const { session } = useSession();

  return useQuery({
    queryKey: ["users-me"],
    queryFn: async () => {
      return await getUsersMe(session);
    },
  });
};
