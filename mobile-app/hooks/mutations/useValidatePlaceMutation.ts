import { queryClient } from "@/constants/QueryClient";
import { useSession } from "@/contexts/AuthContext";
import { validatePlace, ValidatePlaceCreate } from "@/http/validate-place";
import { useMutation } from "@tanstack/react-query";

export const useValidatePlaceMutation = () => {
  const { session } = useSession();

  return useMutation({
    mutationFn: async (body: ValidatePlaceCreate) => {
      try {
        await validatePlace(session, body);
      } catch (error) {
        console.log(
          "=== error in validate place :",
          error,
          // @ts-ignore
          JSON.stringify(error.response.body),
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
