import { useQuery } from "@tanstack/react-query";

import { getUserPublicInfo } from "@/http/users";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for query
export const useUserPublicInfo = (userId?: string) => {
  return useQuery({
    queryKey: ["publicUser", userId],
    enabled: userId !== undefined,
    queryFn: async () => {
      if (userId === undefined) {
        return null;
      }
      return await getUserPublicInfo(userId);
    },
  });
};
