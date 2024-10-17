import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/contexts/AuthContext";
import { getPlaces } from "@/http/places";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const usePlaces = () => {
  const { session } = useSession();

  return useQuery({
    queryKey: ["places"],
    queryFn: async () => {
      return await getPlaces(session);
    },
  });
};
