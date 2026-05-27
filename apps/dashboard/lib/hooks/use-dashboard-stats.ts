import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  type DashboardStatsData,
  generateValidator,
  GetDashboardStatsResponseSchema,
} from "@vagabond/shared-utils";
import { useAtomValue } from "jotai";

import { api } from "@/lib/api/client";
import { dashboardDateRangeAtom } from "@/lib/atoms/dashboard-date-range";

// `orgSlug` est extrait du path Next.js (`/orgs/[orgSlug]/...`) et passé au
// hook par l'appelant. L'API rejette en 404 si l'user n'a pas de membership
// pour cette org (middleware `auth-dashboard.ts`). La réponse est validée par
// AJV via `generateValidator` (parité avec le pattern Mobile App).

const validate = generateValidator(GetDashboardStatsResponseSchema);
export function useDashboardStats(
  orgSlug: string,
): UseQueryResult<DashboardStatsData> {
  const range = useAtomValue(dashboardDateRangeAtom);
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  return useQuery({
    queryKey: ["dashboard", "orgs", orgSlug, "stats", fromIso, toIso],
    queryFn: async (): Promise<DashboardStatsData> => {
      const raw = await api
        .get(`api/dashboard/orgs/${encodeURIComponent(orgSlug)}/stats`, {
          searchParams: { from: fromIso, to: toIso },
        })
        .json();
      if (!validate(raw)) {
        throw new Error(
          "Invalid response from /api/dashboard/orgs/:orgSlug/stats",
        );
      }
      return raw.data;
    },
    enabled: orgSlug.length > 0,
  });
}
