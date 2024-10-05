import { useSession } from "@/contexts/AuthContext";
import { getPlaces } from "@/http/places";
import { useQuery } from "@tanstack/react-query";

export const usePlaces = () => {
  const { session } = useSession();

  return useQuery({
    queryKey: ["places"],
    queryFn: async () => {
      return await getPlaces(session);
    },
  });
};
