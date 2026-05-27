import {
  type InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  type DashboardAppReviewItem,
  generateValidator,
  GetDashboardAppReviewsResponseSchema,
} from "@vagabond/shared-utils";

import { api } from "@/lib/api/client";

export interface DashboardAppReviewsFilters {
  positive: "all" | "yes" | "no";
}

interface AppReviewsPage {
  items: DashboardAppReviewItem[];
  nextCursor: string | null;
}

const validate = generateValidator(GetDashboardAppReviewsResponseSchema);
const LIMIT = 20;

export function useDashboardAppReviews(
  orgSlug: string,
  filters: DashboardAppReviewsFilters,
): UseInfiniteQueryResult<InfiniteData<AppReviewsPage>> {
  return useInfiniteQuery({
    queryKey: ["dashboard", "orgs", orgSlug, "app-reviews", filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<AppReviewsPage> => {
      const searchParams: Record<string, string | number | boolean> = {
        limit: LIMIT,
      };
      if (pageParam !== null) searchParams.after = pageParam;
      if (filters.positive !== "all")
        searchParams.positive = filters.positive === "yes";

      const raw = await api
        .get(`api/dashboard/orgs/${encodeURIComponent(orgSlug)}/app-reviews`, {
          searchParams,
        })
        .json();
      if (!validate(raw)) {
        throw new Error(
          "Invalid response from /api/dashboard/orgs/:orgSlug/app-reviews",
        );
      }
      return raw.data;
    },
    getNextPageParam: (last) => last.nextCursor,
    enabled: orgSlug.length > 0,
  });
}
