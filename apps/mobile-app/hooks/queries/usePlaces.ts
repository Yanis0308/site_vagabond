import { useQuery } from "@tanstack/react-query";

import { getPlaces } from "@/http/places";
import { logger } from "@/utils/logger";
import { type BoundingBoxType } from "@/utils/types";

//eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for mutation
export const usePlaces = (boundingBox: BoundingBoxType) => {
  return useQuery({
    queryKey: ["places", boundingBox],
    queryFn: async () => {
      logger("fetching places");
      return await getPlaces(boundingBox);
    },
    placeholderData: (previousData) => previousData,
  });
};
