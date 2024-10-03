import { useSession } from "@/contexts/AuthContext";
import { apiClient } from "@/http/api-client";
import { useQuery } from "@tanstack/react-query";

export const useUserMe = () => {
  const { session } = useSession();
  return useQuery({
    queryKey: ["users/me"],
    queryFn: () => {
      return apiClient(session).get("users/me");
    },
  });
};
