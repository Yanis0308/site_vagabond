import {
  type InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import {
  type DashboardPoiItem,
  generateValidator,
  GetDashboardPoisResponseSchema,
  type PoiFilterLevelEnum,
} from "@vagabond/shared-utils";

import { api } from "@/lib/api/client";

export interface DashboardPoisFilters {
  search: string;
  filterLevel: PoiFilterLevelEnum | "ALL";
  disabled: "all" | "yes" | "no";
}

interface PoisPage {
  items: DashboardPoiItem[];
  nextCursor: string | null;
}

const validate = generateValidator(GetDashboardPoisResponseSchema);
// Doit rester aligné avec `CursorPaginationQuerySchema.limit.default` côté
// shared-utils. ajv injecte le défaut côté serveur, mais on l'envoie explicite
// pour rester déterministe côté front et que la queryKey reflète le payload.
const LIMIT = 20;

export function useDashboardPois(
  orgSlug: string,
  filters: DashboardPoisFilters,
): UseInfiniteQueryResult<InfiniteData<PoisPage>> {
  return useInfiniteQuery({
    queryKey: ["dashboard", "orgs", orgSlug, "pois", filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<PoisPage> => {
      const searchParams: Record<string, string | number | boolean> = {
        limit: LIMIT,
      };
      if (pageParam !== null) searchParams.after = pageParam;
      if (filters.search.length > 0) searchParams.search = filters.search;
      if (filters.filterLevel !== "ALL")
        searchParams.filterLevel = filters.filterLevel;
      if (filters.disabled !== "all")
        searchParams.disabled = filters.disabled === "yes";

      const raw = await api
        .get(`api/dashboard/orgs/${encodeURIComponent(orgSlug)}/pois`, {
          searchParams,
        })
        .json();
      if (!validate(raw)) {
        throw new Error(
          "Invalid response from /api/dashboard/orgs/:orgSlug/pois",
        );
      }
      return raw.data;
    },
    getNextPageParam: (last) => last.nextCursor,
    enabled: orgSlug.length > 0,
  });
}
