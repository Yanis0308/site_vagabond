import { useQuery } from "@tanstack/react-query";

import { getValidatedPlaces } from "@/http/validate-place";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for mutation
export const useValidatedPlaces = () => {
  return useQuery({
    queryKey: ["validated-places"],
    queryFn: async () => {
      return await getValidatedPlaces();
    },
  });
};
