import { type Static } from "@sinclair/typebox";
import { useMutation } from "@tanstack/react-query";
import { type jsonSchemas } from "@vagabond/shared-utils";

import { queryClient } from "@/constants/QueryClient";
import { forceBboxCacheRefresh } from "@/hooks/queries/useBboxCacheUtils";
import { validatePlace } from "@/http/validate-place";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useValidatePlaceMutation = () => {
  return useMutation({
    mutationFn: async (
      body: Static<typeof jsonSchemas.CreateVisitedPoiRequestSchema> & {
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
    onSuccess: async () => {
      return await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["validated-places"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["places"],
        }),
        // Forcer le rafraîchissement du cache bbox pour actualiser les avis des places
        forceBboxCacheRefresh(queryClient, "places"),
      ]);
    },
  });
};
