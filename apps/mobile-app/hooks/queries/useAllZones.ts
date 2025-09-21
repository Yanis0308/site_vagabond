import { useQuery } from "@tanstack/react-query";

import { getAllZones } from "@/http/zones";
import { logger } from "@/utils/logger";
import { type ZoneStatType } from "@/utils/types";

export const useAllZones = (): {
  data: ZoneStatType[] | undefined;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const queryResult = useQuery({
    queryKey: ["all-zones"],
    queryFn: async () => {
      logger("fetching all zones");
      return await getAllZones();
    },
    staleTime: Infinity,
  });

  return queryResult;
};

export type { ZoneStatType };
