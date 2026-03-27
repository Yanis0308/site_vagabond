import { useMutation } from "@tanstack/react-query";
import { type UserAppReviewRequest } from "@vagabond/shared-utils";

import { queryClient } from "@/constants/QueryClient";
import { submitAppReview } from "@/http/users";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- not important
export const useAppReviewMutation = () => {
  return useMutation({
    mutationFn: ({ positive, comment }: UserAppReviewRequest) =>
      submitAppReview(positive, comment ?? null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });
};
