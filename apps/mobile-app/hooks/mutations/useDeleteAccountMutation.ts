import { getAuth } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { deleteMe } from "@/http/users";
import { trackEvent } from "@/lib/analytics/analytics";
import { logger } from "@/utils/logger";

export const useDeleteAccountMutation = (): UseMutationResult<
  void,
  Error,
  void
> => {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await deleteMe();

      try {
        await GoogleSignin.revokeAccess();
      } catch (error) {
        logger("Error revoking Google access during account deletion", error);
      }

      await getAuth().signOut();
    },
    onSuccess: (): void => {
      void trackEvent("account_deleted");
    },
  });
};
