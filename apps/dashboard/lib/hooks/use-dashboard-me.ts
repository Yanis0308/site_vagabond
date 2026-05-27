import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  type DashboardMe,
  generateValidator,
  GetDashboardMeResponseSchema,
} from "@vagabond/shared-utils";

import { api } from "@/lib/api/client";

// Charge l'identité Dashboard + la liste des organisations accessibles à l'user
// authentifié (cf. ADR 0009). Appelé au boot par la home Dashboard et par
// l'`OrgPicker` dans la sidebar. La réponse est validée par AJV via
// `generateValidator` (parité avec le pattern Mobile App, cf. http/users.ts).

const validate = generateValidator(GetDashboardMeResponseSchema);
export function useDashboardMe(): UseQueryResult<DashboardMe> {
  return useQuery({
    queryKey: ["dashboard", "me"],
    queryFn: async (): Promise<DashboardMe> => {
      const raw = await api.get("api/dashboard/me").json();
      if (!validate(raw)) {
        throw new Error("Invalid response from /api/dashboard/me");
      }
      return raw.data;
    },
  });
}
