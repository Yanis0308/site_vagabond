import { useQuery } from "@tanstack/react-query";
import type { ZoneUserStatV2 } from "@vagabond/shared-utils";

import { getUserZoneStatsV2 } from "@/http/zones";

// v2 : payload allégé. Les POIs détaillés ne sont plus embarqués —
// le profil les lazy-load par boundary via useVisitedPoisByBoundary à l'expansion.
export const useUserZoneStats = (
  userId?: string,
): {
  data: ZoneUserStatV2[] | undefined;
  isSuccess: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: unknown;
} => {
  const query = useQuery({
    queryKey: ["user-zone-stats", userId ?? "me"],
    queryFn: () => getUserZoneStatsV2(userId),
  });

  return {
    data: query.data,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    error: query.error,
  };
};
