import { useQuery } from "@tanstack/react-query";

import { getUserZoneStats } from "@/http/zones";
import { logger } from "@/utils/logger";
import { type ZoneUserStatType } from "@/utils/types";

export const useUserZoneStats = (): {
  data: ZoneUserStatType[] | undefined;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const queryResult = useQuery({
    queryKey: ["user-zone-stats"],
    queryFn: async () => {
      logger("fetching all zones");
      return await getUserZoneStats();
    },
  });

  return queryResult;
};
