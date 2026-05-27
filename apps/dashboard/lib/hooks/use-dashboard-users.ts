import {
  type InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  type DashboardUserItem,
  generateValidator,
  GetDashboardUsersResponseSchema,
} from "@vagabond/shared-utils";

import { api } from "@/lib/api/client";

export interface DashboardUsersFilters {
  search: string;
}

interface UsersPage {
  items: DashboardUserItem[];
  nextCursor: string | null;
}

const validate = generateValidator(GetDashboardUsersResponseSchema);
// Aligné avec `CursorPaginationQuerySchema.limit.default` côté shared-utils.
const LIMIT = 20;

export function useDashboardUsers(
  orgSlug: string,
  filters: DashboardUsersFilters,
): UseInfiniteQueryResult<InfiniteData<UsersPage>> {
  return useInfiniteQuery({
    queryKey: ["dashboard", "orgs", orgSlug, "users", filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<UsersPage> => {
      const searchParams: Record<string, string | number> = { limit: LIMIT };
      if (pageParam !== null) searchParams.after = pageParam;
      if (filters.search.length > 0) searchParams.search = filters.search;

      const raw = await api
        .get(`api/dashboard/orgs/${encodeURIComponent(orgSlug)}/users`, {
          searchParams,
        })
        .json();
      if (!validate(raw)) {
        throw new Error(
          "Invalid response from /api/dashboard/orgs/:orgSlug/users",
        );
      }
      return raw.data;
    },
    getNextPageParam: (last) => last.nextCursor,
    enabled: orgSlug.length > 0,
  });
}
