import { useMutation } from "@tanstack/react-query";
import { type CreateVisitedPoiRequest } from "@vagabond/shared-utils";

import { queryClient } from "@/constants/QueryClient";
import { validatePlace } from "@/http/validate-place";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useValidatePlaceMutation = () => {
  return useMutation({
    mutationFn: async (
      body: CreateVisitedPoiRequest & {
        placeId: string;
      },
    ) => {
      logger("validate place mutation", body);
      try {
        await validatePlace(body.placeId, body);
      } catch (error) {
        logger(
          "=== error in validate place :",
          error,
          // @ts-expect-error log the full error response if exists
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- will fix later
          JSON.stringify(error?.response?.body ?? {}),
        );
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      return void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["user-zone-stats"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["visited-pois", variables.placeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["user-visited-pois"],
        }),
      ]);
    },
  });
};
