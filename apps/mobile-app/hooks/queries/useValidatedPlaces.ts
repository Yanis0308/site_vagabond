import { useQuery } from "@tanstack/react-query";

import {
  getValidatedPlaces,
  type ValidatedPlaceType,
} from "@/http/validate-place";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- OK for mutation
export const useValidatedPlaces = () => {
  return useQuery({
    queryKey: ["validated-places"],
    queryFn: () => {
      const validatedPlacesMap = new Map<number, ValidatedPlaceType>();
      logger("get validated places");
      const validatedPlaces = getValidatedPlaces(0);
      for (const validatedPlace of validatedPlaces) {
        validatedPlacesMap.set(validatedPlace.place.id, validatedPlace);
      }
      return validatedPlacesMap;
    },
  });
};
