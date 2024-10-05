import { useSession } from "@/contexts/AuthContext";
import { useUserMe } from "@/hooks/queries/useUserMe";
import { getValidatedPlaces } from "@/http/validate-place";
import { useQuery } from "@tanstack/react-query";

export const useValidatedPlaces = () => {
  const { session } = useSession();
  const { data: usersMeData } = useUserMe();

  return useQuery({
    queryKey: ["validated-places", usersMeData],
    queryFn: async () => {
      if (usersMeData === undefined) return [];
      console.log("get validated places");
      return await getValidatedPlaces(session, usersMeData.id);
    },
  });
};
