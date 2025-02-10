import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/constants/QueryClient";
import { validatePlace, type ValidatePlaceCreate } from "@/http/validate-place";
import { logger } from "@/utils/logger";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useValidatePlaceMutation = () => {
  return useMutation({
    mutationFn: async (body: ValidatePlaceCreate) => {
      try {
        await validatePlace(body);
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
      await queryClient.invalidateQueries(
        {
          queryKey: ["validated-places"],
          refetchType: "all",
        },
        // { throwOnError, cancelRefetch },
      );
    },
  });
};
