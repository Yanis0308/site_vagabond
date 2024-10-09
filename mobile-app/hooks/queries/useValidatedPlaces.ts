import { useSession } from "@/contexts/AuthContext";
import { useUserMe } from "@/hooks/queries/useUserMe";
import { getValidatedPlaces, ValidatedPlaceType } from "@/http/validate-place";
import { useQuery } from "@tanstack/react-query";

export const useValidatedPlaces = () => {
  const { session } = useSession();
  const { data: usersMeData } = useUserMe();

  return useQuery({
    queryKey: ["validated-places", usersMeData],
    queryFn: async () => {
      const validatedPlacesMap = new Map<number, ValidatedPlaceType>();
      if (usersMeData === undefined) return validatedPlacesMap;
      console.log("get validated places");
      const validatedPlaces = await getValidatedPlaces(session, usersMeData.id);
      for (const validatedPlace of validatedPlaces) {
        validatedPlacesMap.set(validatedPlace.place.id, validatedPlace);
      }
      return validatedPlacesMap;
    },
  });
};
