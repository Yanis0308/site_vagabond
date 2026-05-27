import {
  type InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  type DashboardFeedbackItem,
  generateValidator,
  GetDashboardFeedbacksResponseSchema,
  type UserFeedbackCategory,
} from "@vagabond/shared-utils";

import { api } from "@/lib/api/client";

export interface DashboardFeedbacksFilters {
  category: UserFeedbackCategory | "ALL";
}

interface FeedbacksPage {
  items: DashboardFeedbackItem[];
  nextCursor: string | null;
}

const validate = generateValidator(GetDashboardFeedbacksResponseSchema);
// Aligné avec `CursorPaginationQuerySchema.limit.default` côté shared-utils.
const LIMIT = 20;

export function useDashboardFeedbacks(
  orgSlug: string,
  filters: DashboardFeedbacksFilters,
): UseInfiniteQueryResult<InfiniteData<FeedbacksPage>> {
  return useInfiniteQuery({
    queryKey: ["dashboard", "orgs", orgSlug, "feedbacks", filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<FeedbacksPage> => {
      const searchParams: Record<string, string | number> = { limit: LIMIT };
      if (pageParam !== null) searchParams.after = pageParam;
      if (filters.category !== "ALL") searchParams.category = filters.category;

      const raw = await api
        .get(`api/dashboard/orgs/${encodeURIComponent(orgSlug)}/feedbacks`, {
          searchParams,
        })
        .json();
      if (!validate(raw)) {
        throw new Error(
          "Invalid response from /api/dashboard/orgs/:orgSlug/feedbacks",
        );
      }
      return raw.data;
    },
    getNextPageParam: (last) => last.nextCursor,
    enabled: orgSlug.length > 0,
  });
}
